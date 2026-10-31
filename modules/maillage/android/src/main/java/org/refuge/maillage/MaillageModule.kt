package org.refuge.maillage

import android.content.Context
import android.util.Base64
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec

/**
 * Messagerie de proximité : chaque téléphone Refuge annonce sa présence en Bluetooth Low Energy,
 * cherche les autres et leur transmet les paquets qu'il connaît (les siens et ceux qu'il relaie).
 * Le natif ne fait que transporter des octets ; le JS décide quoi envoyer, relayer et afficher.
 */
class MaillageModule : Module() {
  private var radio: Radio? = null

  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("Maillage")

    Events("recu", "voisins", "erreur", "journal")

    /** Le téléphone a-t-il le Bluetooth Low Energy, et est-il allumé ? */
    Function("etatBluetooth") {
      Radio.etat(context)
    }

    Function("demarrer") {
      if (radio == null) {
        radio = Radio(
          context.applicationContext,
          recu = { octets, de -> sendEvent("recu", mapOf("donnees" to Base64.encodeToString(octets, Base64.NO_WRAP), "de" to de)) },
          voisins = { n -> sendEvent("voisins", mapOf("nombre" to n)) },
          erreur = { message -> sendEvent("erreur", mapOf("message" to message)) },
          journal = { ligne -> sendEvent("journal", mapOf("ligne" to ligne)) },
        )
      }
      radio!!.demarrer()
      // Écran éteint ou appli en arrière-plan : le service garde la messagerie en vie.
      try {
        MaillageService.lancer(context.applicationContext)
      } catch (e: Exception) {
        sendEvent("journal", mapOf("ligne" to "Service d'arrière-plan refusé : garde l'appli ouverte"))
      }
    }

    Function("arreter") {
      radio?.arreter()
      radio = null
      MaillageService.arreter(context.applicationContext)
    }

    /** Ajoute un paquet à transmettre à tous les téléphones croisés pendant `dureeMs`. `sauf` : d'où il vient. */
    Function("diffuser") { id: String, donnees: String, dureeMs: Double, sauf: String? ->
      radio?.diffuser(id, Base64.decode(donnees, Base64.NO_WRAP), dureeMs.toLong(), sauf)
    }

    /** AES-256-GCM. `cleHex` : 64 caractères hexadécimaux. Renvoie base64(iv + chiffré). */
    Function("chiffrer") { cleHex: String, texte: String ->
      val iv = ByteArray(12).also { SecureRandom().nextBytes(it) }
      val c = Cipher.getInstance("AES/GCM/NoPadding")
      c.init(Cipher.ENCRYPT_MODE, SecretKeySpec(hex(cleHex), "AES"), GCMParameterSpec(128, iv))
      Base64.encodeToString(iv + c.doFinal(texte.toByteArray(Charsets.UTF_8)), Base64.NO_WRAP)
    }

    /** Renvoie le texte, ou null si la clé ne correspond pas (message d'un autre groupe). */
    Function("dechiffrer") { cleHex: String, b64: String ->
      try {
        val tout = Base64.decode(b64, Base64.NO_WRAP)
        val c = Cipher.getInstance("AES/GCM/NoPadding")
        c.init(Cipher.DECRYPT_MODE, SecretKeySpec(hex(cleHex), "AES"), GCMParameterSpec(128, tout.copyOfRange(0, 12)))
        String(c.doFinal(tout.copyOfRange(12, tout.size)), Charsets.UTF_8)
      } catch (e: Exception) {
        null
      }
    }

    OnDestroy {
      radio?.arreter()
      radio = null
      try {
        MaillageService.arreter(context.applicationContext)
      } catch (_: Exception) {
      }
    }
  }

  private fun hex(s: String) = ByteArray(s.length / 2) { i -> s.substring(i * 2, i * 2 + 2).toInt(16).toByte() }
}
