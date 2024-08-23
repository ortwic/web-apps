# PWA to Android App
_(generiert mit perplexity.ai)_

Dieses Projekt konvertiert eine Progressive Web App (PWA) in eine Android-App mithilfe von Bubblewrap.

## Voraussetzungen

Bevor Sie beginnen, stellen Sie sicher, dass folgende Komponenten installiert sind:

1. **Node.js und npm**: 
   - Node.js Version 14 oder höher
   - npm Version 6 oder höher

2. **Java Development Kit (JDK)**:
   - JDK Version 17 oder höher
   - Setzen Sie die JAVA_HOME Umgebungsvariable

3. **Android SDK**:
   - Android Studio (empfohlen) oder standalone Android SDK
   - Android SDK Build-Tools
   - Android SDK Platform-Tools

4. **Bubblewrap CLI**:
```
 npm install -g @bubblewrap/cli 
```

5. **Google Chrome** (für PWA-Audits)

6. **Ein Text-Editor** (z.B. Visual Studio Code, Sublime Text)

## Setup

Initialisieren Sie das Bubblewrap-Projekt:
```
  bubblewrap init --manifest=https://song-repo.web.app/manifest.webmanifest
```

## JDK aktualisieren

Wenn Sie eine ältere Java-Version verwenden:

1. Installieren Sie JDK 17:

```sh
sudo apt update
sudo apt install openjdk-17-jdk
```

2. Aktualisieren Sie JAVA_HOME:

```
 export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64 
```
Fügen Sie diese Zeile auch zu Ihrer `.bashrc` oder `.zshrc` hinzu.

3. Aktualisieren Sie die Gradle-Konfiguration:
Fügen Sie in `gradle.properties` folgende Zeile hinzu:

```
org.gradle.java.home=/usr/lib/jvm/java-17-openjdk-amd64
```

## Gradle Wrapper aktualisieren

Um den Gradle Wrapper auf die erforderliche Version 8.8 zu aktualisieren:

1. Führen Sie im Projektverzeichnis aus:

```
 ./gradlew wrapper --gradle-version 8.8 
```

2. Überprüfen Sie, ob die Aktualisierung erfolgreich war:

```
 ./gradlew --version 
```

## Build-Prozess

1. Bauen Sie die Android-App:

```
bubblewrap build
    ? Key Store: ***aks
    ? Key: ***aks
```

2. Die generierte APK-Datei finden Sie im `build`-Verzeichnis.

## Veröffentlichung

1. Erstellen Sie einen Google Play Developer Account, falls noch nicht vorhanden.

2. Folgen Sie den Anweisungen im Google Play Console, um Ihre App hochzuladen und zu veröffentlichen.

## Fehlerbehebung

- Stellen Sie sicher, dass alle Umgebungsvariablen korrekt gesetzt sind (JAVA_HOME, ANDROID_HOME).
- Überprüfen Sie, ob Ihr Web-Manifest alle erforderlichen Felder enthält.
- Bei Problemen mit dem Keystore, erstellen Sie einen neuen und aktualisieren Sie die Konfiguration.
- Wenn der Build fehlschlägt, versuchen Sie das Bubblewrap-Projekt zu aktualisieren:

```
  bubblewrap update
```

## Keystore-Probleme

Wenn Sie das Passwort für Ihren Keystore vergessen haben:

1. Erstellen Sie einen neuen Keystore:
```
keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-alias
```
2. Aktualisieren Sie die Bubblewrap-Konfiguration mit den neuen Keystore-Informationen.

3. Bauen Sie die App neu und laden Sie sie als neue App im Google Play Store hoch.

## Weitere Ressourcen

- [Bubblewrap Dokumentation](https://github.com/GoogleChromeLabs/bubblewrap)
- [PWA Builder](https://www.pwabuilder.com/)
- [Google Developers PWA](https://developers.google.com/web/progressive-web-apps)

