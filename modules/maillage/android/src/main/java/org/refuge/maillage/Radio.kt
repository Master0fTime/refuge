package org.refuge.maillage

import android.annotation.SuppressLint
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCallback
import android.bluetooth.BluetoothGattCharacteristic
import android.bluetooth.BluetoothGattServer
import android.bluetooth.BluetoothGattServerCallback
import android.bluetooth.BluetoothGattService
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothProfile
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertiseSettings
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanFilter
import android.bluetooth.le.ScanResult
import android.bluetooth.le.ScanSettings
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.ParcelUuid
import java.util.UUID
import kotlin.random.Random

/**
 * Le transport Bluetooth Low Energy. Chaque téléphone est à la fois :
 * - « boîte aux lettres » : un serveur GATT avec une caractéristique où les autres écrivent ;
 * - « facteur » : il cherche les boîtes autour de lui et y dépose les paquets qu'elles n'ont pas encore.
 * Un paquet trop gros pour une seule écriture est découpé en fragments [numéro, index, total, données…].
 *
 * Deux téléphones qui ont chacun quelque chose à envoyer se connecteraient l'un à l'autre au même instant,
 * et les deux connexions échoueraient sans fin. D'où : un délai au hasard avant chaque visite, et aucune
 * visite pendant qu'un voisin est en train de nous écrire.
 * Tout tourne sur le fil principal (Handler) pour éviter les accès concurrents.
 */
@SuppressLint("MissingPermission")
class Radio(
  private val ctx: Context,
  private val recu: (ByteArray, String) -> Unit,
  private val voisins: (Int) -> Unit,
  private val erreur: (String) -> Unit,
  private val journal: (String) -> Unit,
) {
  companion object {
    val SERVICE: UUID = UUID.fromString("7f3c1a20-5e0b-4c55-9d4a-52ef0c2e7a01")
    val BOITE: UUID = UUID.fromString("7f3c1a21-5e0b-4c55-9d4a-52ef0c2e7a01")
    private const val ENTETE = 3
    private const val MTU_VOULU = 185
    private const val TIC_MS = 5_000L
    private const val VOISIN_RECENT_MS = 60_000L
    private const val ATTENTE_ENTRE_ESSAIS_MS = 4_000L
    private const val DELAI_CONNEXION_MS = 20_000L
    private const val HASARD_MAX_MS = 2_500L

    fun etat(ctx: Context): String {
      if (!ctx.packageManager.hasSystemFeature(PackageManager.FEATURE_BLUETOOTH_LE)) return "absent"
      val a = (ctx.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager?)?.adapter ?: return "absent"
      return if (a.isEnabled) "allume" else "eteint"
    }
  }

  private class Paquet(val id: String, val octets: ByteArray, val expire: Long)

  private val main = Handler(Looper.getMainLooper())
  private val gestion = ctx.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
  private var serveur: BluetoothGattServer? = null
  private var annonce: AdvertiseCallback? = null
  private var scan: ScanCallback? = null
  private var actif = false

  /** Paquets à transmettre (les nôtres et ceux qu'on relaie), jusqu'à expiration. */
  private val boite = mutableListOf<Paquet>()
  private val envoyes = HashMap<String, MutableSet<String>>()
  private val appareils = HashMap<String, BluetoothDevice>()
  private val vus = HashMap<String, Long>()
  private val essais = HashMap<String, Long>()
  private val file = ArrayDeque<BluetoothDevice>()
  private var enCours: BluetoothGatt? = null
  private var attente = false
  private val fragments = HashMap<String, Array<ByteArray?>>()
  private var numero = 0
  /** Voisins en train de nous écrire : on ne leur rend pas visite au même moment. */
  private val entrants = mutableSetOf<String>()

  fun demarrer() {
    if (actif) return
    val a = gestion.adapter
    if (a == null) return erreur("Ce téléphone n'a pas de Bluetooth.")
    if (!a.isEnabled) return erreur("Le Bluetooth est éteint : allume-le dans les réglages rapides.")
    actif = true
    try {
      ouvrirServeur()
      annoncer()
      chercher()
    } catch (e: SecurityException) {
      arreter()
      return erreur("Autorisation « Appareils à proximité » refusée pour Refuge.")
    }
    journal("Démarré : annonce et recherche en cours")
    main.postDelayed(tic, TIC_MS)
  }

  fun arreter() {
    actif = false
    main.removeCallbacksAndMessages(null)
    try {
      scan?.let { gestion.adapter?.bluetoothLeScanner?.stopScan(it) }
      annonce?.let { gestion.adapter?.bluetoothLeAdvertiser?.stopAdvertising(it) }
      enCours?.close()
      serveur?.close()
    } catch (_: Exception) {
    }
    scan = null
    annonce = null
    enCours = null
    serveur = null
    file.clear()
    entrants.clear()
  }

  /** `sauf` : adresse dont vient ce paquet (relais), pour ne pas le lui renvoyer. */
  fun diffuser(id: String, octets: ByteArray, dureeMs: Long, sauf: String?) {
    main.post {
      if (boite.none { it.id == id }) {
        boite.add(Paquet(id, octets, System.currentTimeMillis() + dureeMs))
        while (boite.size > 200) boite.removeAt(0)
      }
      sauf?.let { envoyes.getOrPut(it) { mutableSetOf() }.add(id) }
      // Les voisins déjà connus reçoivent le nouveau paquet sans attendre leur prochaine annonce.
      val maintenant = System.currentTimeMillis()
      vus.filter { maintenant - it.value < VOISIN_RECENT_MS }.keys.forEach { a -> appareils[a]?.let { planifier(it) } }
    }
  }

  // ---------- Boîte aux lettres (serveur) ----------

  private fun ouvrirServeur() {
    val rappel = object : BluetoothGattServerCallback() {
      override fun onConnectionStateChange(device: BluetoothDevice, status: Int, newState: Int) {
        main.post {
          if (newState == BluetoothProfile.STATE_CONNECTED) entrants.add(device.address) else entrants.remove(device.address)
        }
      }

      override fun onCharacteristicWriteRequest(
        device: BluetoothDevice,
        requestId: Int,
        characteristic: BluetoothGattCharacteristic,
        preparedWrite: Boolean,
        responseNeeded: Boolean,
        offset: Int,
        value: ByteArray?,
      ) {
        if (responseNeeded) serveur?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, null)
        if (characteristic.uuid == BOITE && value != null) {
          val copie = value.copyOf()
          main.post { recevoirFragment(device.address, copie) }
        }
      }
    }
    val s = gestion.openGattServer(ctx, rappel) ?: throw IllegalStateException("serveur GATT indisponible")
    val service = BluetoothGattService(SERVICE, BluetoothGattService.SERVICE_TYPE_PRIMARY)
    service.addCharacteristic(
      BluetoothGattCharacteristic(
        BOITE,
        BluetoothGattCharacteristic.PROPERTY_WRITE or BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE,
        BluetoothGattCharacteristic.PERMISSION_WRITE,
      ),
    )
    s.addService(service)
    serveur = s
  }

  private fun recevoirFragment(adresse: String, v: ByteArray) {
    if (v.size <= ENTETE) return
    val n = v[0].toInt() and 0xFF
    val index = v[1].toInt() and 0xFF
    val total = v[2].toInt() and 0xFF
    if (total == 0 || index >= total) return
    val cle = "$adresse|$n"
    var morceaux = fragments[cle]
    if (morceaux == null || morceaux.size != total) {
      if (fragments.size > 64) fragments.clear()
      morceaux = arrayOfNulls(total)
      fragments[cle] = morceaux
    }
    morceaux[index] = v.copyOfRange(ENTETE, v.size)
    if (morceaux.all { it != null }) {
      fragments.remove(cle)
      val complet = morceaux.fold(ByteArray(0)) { acc, m -> acc + m!! }
      journal("Reçu un paquet (${complet.size} octets)")
      recu(complet, adresse)
    }
  }

  // ---------- Présence ----------

  private fun annoncer() {
    val adv = gestion.adapter?.bluetoothLeAdvertiser
    if (adv == null) {
      erreur("Ce téléphone ne peut pas s'annoncer en Bluetooth : il recevra les messages des autres, mais ils ne le trouveront pas.")
      return
    }
    val reglages = AdvertiseSettings.Builder()
      .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_BALANCED)
      .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
      .setConnectable(true)
      .build()
    val donnees = AdvertiseData.Builder().setIncludeDeviceName(false).addServiceUuid(ParcelUuid(SERVICE)).build()
    val rappel = object : AdvertiseCallback() {
      override fun onStartFailure(errorCode: Int) {
        erreur("Annonce Bluetooth impossible (code $errorCode).")
      }
    }
    adv.startAdvertising(reglages, donnees, rappel)
    annonce = rappel
  }

  private fun chercher() {
    val scanner = gestion.adapter?.bluetoothLeScanner ?: return erreur("Recherche Bluetooth indisponible.")
    val filtre = ScanFilter.Builder().setServiceUuid(ParcelUuid(SERVICE)).build()
    val reglages = ScanSettings.Builder().setScanMode(ScanSettings.SCAN_MODE_BALANCED).build()
    val rappel = object : ScanCallback() {
      override fun onScanResult(callbackType: Int, result: ScanResult) {
        main.post { vu(result.device) }
      }

      override fun onBatchScanResults(results: MutableList<ScanResult>) {
        main.post { results.forEach { vu(it.device) } }
      }

      override fun onScanFailed(errorCode: Int) {
        erreur("Recherche Bluetooth impossible (code $errorCode).")
      }
    }
    scanner.startScan(listOf(filtre), reglages, rappel)
    scan = rappel
  }

  private fun vu(d: BluetoothDevice) {
    if (d.address !in vus) journal("Voisin trouvé : …${d.address.takeLast(5)}")
    appareils[d.address] = d
    vus[d.address] = System.currentTimeMillis()
    planifier(d)
  }

  private val tic = object : Runnable {
    override fun run() {
      if (!actif) return
      val maintenant = System.currentTimeMillis()
      boite.removeAll { it.expire < maintenant }
      vus.entries.removeAll { maintenant - it.value > 5 * VOISIN_RECENT_MS }
      voisins(vus.count { maintenant - it.value < VOISIN_RECENT_MS })
      // Filet de sécurité : relancer les livraisons en attente.
      vus.filter { maintenant - it.value < VOISIN_RECENT_MS }.keys.forEach { a -> appareils[a]?.let { planifier(it) } }
      main.postDelayed(this, TIC_MS)
    }
  }

  // ---------- Facteur (client) ----------

  private fun aEnvoyer(adresse: String): List<Paquet> {
    val deja = envoyes[adresse].orEmpty()
    return boite.filter { it.id !in deja }
  }

  private fun planifier(d: BluetoothDevice) {
    if (!actif || aEnvoyer(d.address).isEmpty()) return
    if (System.currentTimeMillis() - (essais[d.address] ?: 0L) < ATTENTE_ENTRE_ESSAIS_MS) return
    if (file.any { it.address == d.address } || enCours?.device?.address == d.address) return
    file.addLast(d)
    suivant()
  }

  private fun suivant() {
    if (!actif || enCours != null || attente || file.isEmpty()) return
    // Un voisin nous écrit en ce moment : on attend qu'il ait fini avant de lui rendre visite.
    if (entrants.isNotEmpty()) {
      attente = true
      main.postDelayed({ attente = false; suivant() }, 1_500L)
      return
    }
    // Délai au hasard : si l'autre téléphone a aussi quelque chose pour nous, l'un des deux passe en premier.
    attente = true
    main.postDelayed({ attente = false; visiter() }, Random.nextLong(200L, HASARD_MAX_MS))
  }

  private fun visiter() {
    if (!actif || enCours != null) return
    if (entrants.isNotEmpty()) return suivant()
    val d = file.removeFirstOrNull() ?: return
    essais[d.address] = System.currentTimeMillis()
    val paquets = aEnvoyer(d.address)
    if (paquets.isEmpty()) return suivant()
    journal("Envoi de ${paquets.size} paquet(s) à …${d.address.takeLast(5)}")
    val g = try {
      d.connectGatt(ctx, false, Livraison(d.address, paquets), BluetoothDevice.TRANSPORT_LE)
    } catch (e: SecurityException) {
      null
    } ?: return suivant()
    enCours = g
    main.postDelayed({
      if (enCours === g) {
        journal("Délai dépassé avec …${d.address.takeLast(5)}")
        terminer(g)
      }
    }, DELAI_CONNEXION_MS)
  }

  private fun terminer(g: BluetoothGatt) {
    try {
      g.disconnect()
      g.close()
    } catch (_: Exception) {
    }
    if (enCours === g) enCours = null
    main.post { suivant() }
  }

  /** Une visite chez un voisin : connexion, services, taille des écritures, puis les fragments un par un. */
  private inner class Livraison(private val adresse: String, private val paquets: List<Paquet>) : BluetoothGattCallback() {
    /** Fragment à écrire + identifiant du paquet qu'il termine (null s'il n'est pas le dernier). */
    private val frames = ArrayDeque<Pair<ByteArray, String?>>()
    private var taille = 20
    private var carac: BluetoothGattCharacteristic? = null
    private var dernier: String? = null
    private var livres = 0
    private var fini = false

    override fun onConnectionStateChange(g: BluetoothGatt, status: Int, newState: Int) {
      main.post {
        if (newState == BluetoothProfile.STATE_CONNECTED && status == BluetoothGatt.GATT_SUCCESS) {
          if (!g.discoverServices()) fin(g, "découverte impossible")
        } else {
          fin(g, "connexion perdue (statut $status)")
        }
      }
    }

    override fun onServicesDiscovered(g: BluetoothGatt, status: Int) {
      main.post {
        val c = g.getService(SERVICE)?.getCharacteristic(BOITE)
        if (c == null) return@post fin(g, "boîte aux lettres introuvable")
        carac = c
        // Taille des écritures demandée APRÈS la découverte : plus fiable sur de nombreux téléphones.
        if (!g.requestMtu(MTU_VOULU)) preparerEtEcrire(g)
      }
    }

    override fun onMtuChanged(g: BluetoothGatt, mtu: Int, status: Int) {
      main.post {
        if (status == BluetoothGatt.GATT_SUCCESS) taille = mtu - 3
        preparerEtEcrire(g)
      }
    }

    private fun preparerEtEcrire(g: BluetoothGatt) {
      if (frames.isNotEmpty() || fini) return
      val utile = (taille - ENTETE).coerceAtLeast(1)
      for (p in paquets) {
        val n = numero++ and 0xFF
        val total = (p.octets.size + utile - 1) / utile
        if (total > 255) continue
        for (i in 0 until total) {
          val morceau = p.octets.copyOfRange(i * utile, minOf(p.octets.size, (i + 1) * utile))
          frames.addLast(Pair(byteArrayOf(n.toByte(), i.toByte(), total.toByte()) + morceau, if (i == total - 1) p.id else null))
        }
      }
      ecrire(g)
    }

    override fun onCharacteristicWrite(g: BluetoothGatt, characteristic: BluetoothGattCharacteristic, status: Int) {
      main.post {
        if (status != BluetoothGatt.GATT_SUCCESS) return@post fin(g, "écriture refusée (statut $status)")
        // Chaque paquet compte comme livré dès son dernier fragment : rien n'est perdu si la suite échoue.
        dernier?.let {
          envoyes.getOrPut(adresse) { mutableSetOf() }.add(it)
          livres++
        }
        ecrire(g)
      }
    }

    private fun ecrire(g: BluetoothGatt) {
      val c = carac ?: return fin(g, "pas de boîte")
      val f = frames.removeFirstOrNull() ?: return fin(g, null)
      dernier = f.second
      val ok = if (Build.VERSION.SDK_INT >= 33) {
        g.writeCharacteristic(c, f.first, BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT) == 0
      } else {
        @Suppress("DEPRECATION")
        c.writeType = BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT
        @Suppress("DEPRECATION")
        c.value = f.first
        @Suppress("DEPRECATION")
        g.writeCharacteristic(c)
      }
      if (!ok) fin(g, "écriture impossible")
    }

    private fun fin(g: BluetoothGatt, probleme: String?) {
      if (fini) return
      fini = true
      journal(
        if (probleme == null) "Livré : $livres paquet(s) à …${adresse.takeLast(5)}"
        else "Échec avec …${adresse.takeLast(5)} : $probleme ($livres/${paquets.size} livrés)",
      )
      // Après un échec, on réessaie bientôt (avec un nouveau délai au hasard).
      if (probleme != null) essais[adresse] = System.currentTimeMillis() - ATTENTE_ENTRE_ESSAIS_MS / 2
      terminer(g)
    }
  }
}
