package org.refuge.partage

import java.io.BufferedInputStream
import java.io.File
import java.io.IOException
import java.io.InputStream
import java.io.OutputStream
import java.io.RandomAccessFile
import java.net.ServerSocket
import java.net.Socket
import java.net.URLDecoder
import java.util.concurrent.Executors

/**
 * Petit serveur HTTP qui ne sert QUE le dossier `racine` (packs, page d'accueil) et l'APK installé.
 * Rien d'autre n'est accessible : les données privées de l'appli sont stockées ailleurs.
 * Gère l'en-tête Range pour reprendre un téléchargement interrompu.
 */
class ServeurLocal(private val racine: File, private val apk: File, port: Int) {
  private val socket = ServerSocket(port)
  private val pool = Executors.newFixedThreadPool(8)
  private val racineCanonique = racine.canonicalPath + File.separator

  @Volatile private var actif = true

  val port: Int
    get() = socket.localPort

  fun demarrer() {
    Thread {
      while (actif) {
        try {
          val client = socket.accept()
          pool.execute { traiter(client) }
        } catch (e: IOException) {
          if (!actif) break
        }
      }
    }.apply { isDaemon = true; name = "refuge-serveur" }.start()
  }

  fun arreter() {
    actif = false
    try { socket.close() } catch (_: IOException) {}
    pool.shutdownNow()
  }

  private fun traiter(client: Socket) {
    try {
      client.use { c ->
        c.soTimeout = 30_000
        val entree = BufferedInputStream(c.getInputStream())
        val sortie = c.getOutputStream()
        val requete = lireLigne(entree) ?: return
        var range: String? = null
        while (true) {
          val h = lireLigne(entree) ?: break
          if (h.isEmpty()) break
          if (h.lowercase().startsWith("range:")) range = h.substring(6).trim()
        }
        val morceaux = requete.split(" ")
        if (morceaux.size < 2 || (morceaux[0] != "GET" && morceaux[0] != "HEAD")) {
          repondreTexte(sortie, 405, "Method Not Allowed")
          return
        }
        val tete = morceaux[0] == "HEAD"
        var chemin = URLDecoder.decode(morceaux[1].substringBefore('?'), "UTF-8")
        if (chemin == "/" || chemin.isEmpty()) chemin = "/index.html"

        val fichier = if (chemin == "/refuge.apk") apk else File(racine, chemin.removePrefix("/"))
        // Protection contre « ../ » : on refuse tout ce qui sort du dossier de partage.
        if (fichier != apk && !fichier.canonicalPath.startsWith(racineCanonique)) {
          repondreTexte(sortie, 403, "Forbidden")
          return
        }
        if (!fichier.isFile) {
          repondreTexte(sortie, 404, "Not Found")
          return
        }
        envoyerFichier(sortie, fichier, range, tete)
      }
    } catch (_: IOException) {
      // Client parti en cours de route : rien à faire.
    }
  }

  private fun envoyerFichier(sortie: OutputStream, fichier: File, range: String?, tete: Boolean) {
    val taille = fichier.length()
    var debut = 0L
    var fin = taille - 1
    var partiel = false
    if (range != null && range.startsWith("bytes=")) {
      val (a, b) = range.removePrefix("bytes=").split("-", limit = 2).let { it[0] to it.getOrElse(1) { "" } }
      a.toLongOrNull()?.let { debut = it; partiel = true }
      b.toLongOrNull()?.let { fin = minOf(it, taille - 1) }
      if (debut >= taille) {
        ecrireEntetes(sortie, "416 Range Not Satisfiable", mapOf("Content-Range" to "bytes */$taille", "Content-Length" to "0"))
        return
      }
    }
    val longueur = fin - debut + 1
    val entetes = linkedMapOf(
      "Content-Type" to typeMime(fichier.name),
      "Content-Length" to longueur.toString(),
      "Accept-Ranges" to "bytes",
    )
    if (partiel) entetes["Content-Range"] = "bytes $debut-$fin/$taille"
    if (!fichier.name.endsWith(".html") && !fichier.name.endsWith(".json")) {
      val nom = if (fichier == apk) "Refuge.apk" else fichier.name
      entetes["Content-Disposition"] = "attachment; filename=\"$nom\""
    }
    ecrireEntetes(sortie, if (partiel) "206 Partial Content" else "200 OK", entetes)
    if (tete) return

    RandomAccessFile(fichier, "r").use { raf ->
      raf.seek(debut)
      val tampon = ByteArray(256 * 1024)
      var reste = longueur
      while (reste > 0) {
        val lu = raf.read(tampon, 0, minOf(tampon.size.toLong(), reste).toInt())
        if (lu < 0) break
        sortie.write(tampon, 0, lu)
        reste -= lu
      }
    }
    sortie.flush()
  }

  private fun ecrireEntetes(sortie: OutputStream, statut: String, entetes: Map<String, String>) {
    val sb = StringBuilder("HTTP/1.1 $statut\r\n")
    for ((k, v) in entetes) sb.append(k).append(": ").append(v).append("\r\n")
    sb.append("Connection: close\r\n\r\n")
    sortie.write(sb.toString().toByteArray(Charsets.UTF_8))
  }

  private fun repondreTexte(sortie: OutputStream, code: Int, texte: String) {
    val corps = texte.toByteArray(Charsets.UTF_8)
    ecrireEntetes(sortie, "$code $texte", mapOf("Content-Type" to "text/plain; charset=utf-8", "Content-Length" to corps.size.toString()))
    sortie.write(corps)
    sortie.flush()
  }

  private fun lireLigne(entree: InputStream): String? {
    val sb = StringBuilder()
    while (sb.length < 8192) {
      val b = entree.read()
      if (b < 0) return if (sb.isEmpty()) null else sb.toString()
      if (b == '\n'.code) return sb.toString().trimEnd('\r')
      sb.append(b.toChar())
    }
    return sb.toString()
  }

  private fun typeMime(nom: String) = when {
    nom.endsWith(".apk") -> "application/vnd.android.package-archive"
    nom.endsWith(".html") -> "text/html; charset=utf-8"
    nom.endsWith(".json") -> "application/json; charset=utf-8"
    else -> "application/octet-stream"
  }
}
