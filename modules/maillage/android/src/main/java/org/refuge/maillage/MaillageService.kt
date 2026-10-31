package org.refuge.maillage

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder

/**
 * Service de premier plan : garde Refuge en vie, écran éteint ou appli en arrière-plan, pour continuer
 * à recevoir et relayer les messages. Android exige une notification visible tant qu'il tourne.
 */
class MaillageService : Service() {
  companion object {
    private const val CANAL = "maillage"
    private const val ID = 4207

    fun lancer(ctx: Context) {
      val i = Intent(ctx, MaillageService::class.java)
      if (Build.VERSION.SDK_INT >= 26) ctx.startForegroundService(i) else ctx.startService(i)
    }

    fun arreter(ctx: Context) {
      ctx.stopService(Intent(ctx, MaillageService::class.java))
    }
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val gestion = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= 26) {
      gestion.createNotificationChannel(NotificationChannel(CANAL, "Messagerie Bluetooth", NotificationManager.IMPORTANCE_LOW))
    }
    val ouvrir = packageManager.getLaunchIntentForPackage(packageName)?.let {
      PendingIntent.getActivity(this, 0, it, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
    }
    val builder = if (Build.VERSION.SDK_INT >= 26) Notification.Builder(this, CANAL) else @Suppress("DEPRECATION") Notification.Builder(this)
    val notif = builder
      .setSmallIcon(applicationInfo.icon)
      .setContentTitle("Refuge écoute ton groupe")
      .setContentText("Messages Bluetooth actifs, même écran éteint. Touche pour ouvrir.")
      .setOngoing(true)
      .setContentIntent(ouvrir)
      .build()
    try {
      if (Build.VERSION.SDK_INT >= 34) {
        startForeground(ID, notif, ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE)
      } else {
        startForeground(ID, notif)
      }
    } catch (e: Exception) {
      // Refusé (appli en arrière-plan, autorisation manquante) : la messagerie marche quand l'appli est ouverte.
      stopSelf()
    }
    return START_STICKY
  }
}
