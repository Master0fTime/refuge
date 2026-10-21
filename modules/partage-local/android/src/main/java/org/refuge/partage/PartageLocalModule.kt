package org.refuge.partage

import android.content.Context
import android.net.wifi.WifiManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.net.Inet4Address
import java.net.NetworkInterface

class PartageLocalModule : Module() {
  private var reservation: WifiManager.LocalOnlyHotspotReservation? = null
  private var serveur: ServeurLocal? = null

  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("PartageLocal")

    /** Chemin de l'APK installé : c'est lui qu'on transmet aux proches. */
    Function("cheminApk") {
      context.applicationInfo.sourceDir
    }

    /** Crée un Wi-Fi local (sans Internet ni carte SIM) et renvoie son nom et son mot de passe. */
    AsyncFunction("demarrerWifi") { promise: Promise ->
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
        promise.reject("ANDROID_ANCIEN", "Le Wi-Fi local demande Android 8 ou plus récent.", null)
        return@AsyncFunction
      }
      reservation?.let {
        promise.resolve(infosWifi(it))
        return@AsyncFunction
      }
      val wifi = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
      var regle = false
      try {
        wifi.startLocalOnlyHotspot(object : WifiManager.LocalOnlyHotspotCallback() {
          override fun onStarted(r: WifiManager.LocalOnlyHotspotReservation) {
            reservation = r
            if (!regle) { regle = true; promise.resolve(infosWifi(r)) }
          }

          override fun onStopped() {
            reservation = null
          }

          override fun onFailed(reason: Int) {
            if (!regle) { regle = true; promise.reject("WIFI_ECHEC", messageEchec(reason), null) }
          }
        }, Handler(Looper.getMainLooper()))
      } catch (e: SecurityException) {
        promise.reject("PERMISSION", "Autorisation refusée : autorise « Appareils à proximité » ou la localisation pour Refuge.", e)
      } catch (e: IllegalStateException) {
        promise.reject("WIFI_OCCUPE", "Un Wi-Fi local est déjà actif. Désactive le partage de connexion puis réessaie.", e)
      }
    }

    Function("arreterWifi") {
      reservation?.close()
      reservation = null
    }

    /** Démarre le serveur sur le dossier de partage. Port 0 = n'importe quel port libre. Renvoie le port. */
    Function("demarrerServeur") { racine: String, port: Int ->
      serveur?.arreter()
      val s = ServeurLocal(File(racine.removePrefix("file://")), File(context.applicationInfo.sourceDir), port)
      s.demarrer()
      serveur = s
      s.port
    }

    Function("arreterServeur") {
      serveur?.arreter()
      serveur = null
    }

    /** Adresses IPv4 du téléphone, sous la forme « interface|adresse ». */
    Function("adressesIp") {
      NetworkInterface.getNetworkInterfaces()?.toList().orEmpty()
        .filter { it.isUp && !it.isLoopback }
        .flatMap { i -> i.inetAddresses.toList().filterIsInstance<Inet4Address>().map { "${i.name}|${it.hostAddress}" } }
    }

    OnDestroy {
      serveur?.arreter()
      reservation?.close()
    }
  }

  @Suppress("DEPRECATION")
  private fun infosWifi(r: WifiManager.LocalOnlyHotspotReservation): Map<String, String?> {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      val conf = r.softApConfiguration
      mapOf("ssid" to conf.ssid?.trim('"'), "motDePasse" to conf.passphrase)
    } else {
      val conf = r.wifiConfiguration
      mapOf("ssid" to conf?.SSID?.trim('"'), "motDePasse" to conf?.preSharedKey?.trim('"'))
    }
  }

  private fun messageEchec(raison: Int) = when (raison) {
    WifiManager.LocalOnlyHotspotCallback.ERROR_INCOMPATIBLE_MODE ->
      "Le Wi-Fi local n'a pas pu démarrer : désactive le partage de connexion (point d'accès) et réessaie."
    WifiManager.LocalOnlyHotspotCallback.ERROR_TETHERING_DISALLOWED ->
      "Ce téléphone interdit le Wi-Fi local (restriction de l'opérateur ou de l'entreprise)."
    WifiManager.LocalOnlyHotspotCallback.ERROR_NO_CHANNEL ->
      "Aucun canal Wi-Fi disponible. Active le Wi-Fi, puis réessaie."
    else -> "Le Wi-Fi local n'a pas pu démarrer. Active le Wi-Fi et la localisation, puis réessaie."
  }
}
