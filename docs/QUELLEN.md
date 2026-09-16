# Technische Quellen

Recherche-/Abrufstand: **16.09.2026**. Die Quellen stützen technische Möglichkeiten und Grenzen; sie belegen keine bereits funktionierende Implementierung unseres Trainers. Anbieterbedingungen vor Einrichtung und Veröffentlichung erneut prüfen.

| Thema | Offizielle Quelle | Bedeutung für dieses Projekt |
| --- | --- | --- |
| iPhone-Web-App | [Apple: Website als App](https://support.apple.com/de-ch/guide/iphone/iphea86e5236/ios) | Nutzung über den Home-Bildschirm ist vorgesehen. |
| Lokaler Dateizugriff | [Chrome: File System Access](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access) | Direkter dauerhafter Dateizugriff ist keine plattformübergreifend verlässliche iOS-Grundlage. |
| Ordnerauswahl | [MDN: showDirectoryPicker](https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker) | Begrenzte Browserunterstützung; kein Ersatz für Drive-Synchronisation. |
| Offlinebetrieb | [MDN: Offline and background operation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation) | Service Worker und Offlinekonzept; Hintergrundfunktionen nicht pauschal auf allen Geräten zusagen. |
| Lokale Daten | [MDN: IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) | Kandidat für strukturierte lokale Daten. |
| Programmupdates | [MDN: Using Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers) | Sichere Bereitstellung, eigener App-Pfad und kontrollierte Cache-Aktivierung. |
| Safari-Speicher | [WebKit: Updates to Storage Policy](https://webkit.org/blog/14403/updates-to-storage-policy/) | Lokalen Browserspeicher nicht mit einer unabhängigen Datensicherung verwechseln. |
| Hosting | [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) | Statisches Hosting für öffentliche Repositories im kostenlosen GitHub-Tarif verfügbar. |
| Drive-Kosten/Limits | [Google: Usage limits](https://developers.google.com/workspace/drive/api/guides/limits) | Nutzung innerhalb der dokumentierten kostenlosen Grenzen planen; keine allgemeine unbegrenzte Gratiszusage. |
| Drive-Berechtigungen | [Google: API scopes](https://developers.google.com/workspace/drive/api/guides/api-specific-auth) | `drive.file` für angelegte/ausgewählte Dateien; nicht mit vollständigem Drive-Zugriff verwechseln. |
| Wiederholbare Uploads | [Google: Pre-generated file IDs](https://developers.google.com/workspace/drive/api/guides/manage-uploads#use_a_pre-generated_id_to_upload_files) | Stabile vorab erzeugte Datei-IDs erlauben Wiederholung ohne zusätzliche Dateianlage; fachliche Ereignisse trotzdem selbst deduplizieren. |
| Datensätze wiederfinden | [Google: File properties](https://developers.google.com/workspace/drive/api/guides/properties), [Google: Search files](https://developers.google.com/workspace/drive/api/guides/search-files) | App-Metadaten und paginierte Suche für die eigenen Trainerdateien. |
| Versteckte App-Daten | [Google: Application-specific data](https://developers.google.com/workspace/drive/api/guides/appdata) | `appDataFolder` ist verborgen und nicht teilbar; anderer Ansatz als ein sichtbarer Trainerordner. |
| Browseranmeldung | [Google: Use the token model](https://developers.google.com/identity/oauth2/web/guides/use-token-model) | Zugriffstoken kann ablaufen; erneute Nutzeraktion einplanen. |
| OAuth-Grundlagen | [Google: OAuth 2.0](https://developers.google.com/identity/protocols/oauth2) | Web-Clienttyp, Tokenlebensdauer und Unterschied zu Refresh-Tokens. |
| OAuth-Einrichtung | [Google: Create credentials](https://developers.google.com/workspace/guides/create-credentials) | Web-Anwendung registrieren und verwendete Ursprünge konfigurieren. |
| Zielgruppe/Scopes | [Google: Configure OAuth consent](https://developers.google.com/workspace/guides/configure-oauth-consent) | Zugriffsanforderungen, Testnutzer und Zielgruppe bei der Einrichtung prüfen. |
| OAuth-Regeln | [Google: Policy compliance](https://developers.google.com/identity/protocols/oauth2/production-readiness/policy-compliance) | Anforderungen anhand der tatsächlichen Nutzung prüfen. |
| Repository-Lizenz | [GitHub: Licensing a repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository) | Eine allgemeine Lizenz ist nicht verpflichtend; ohne Lizenz gelten die gesetzlichen Ausgangsrechte. Öffentliche GitHub-Repositories dürfen nach den GitHub-Bedingungen angesehen und geforkt werden. |
| MIT-Lizenz | [Open Source Initiative: MIT License](https://opensource.org/license/mit) | Erlaubt auch kommerzielle Nutzung, Änderung und Weitergabe bei Beibehaltung von Urheberrechts- und Lizenzhinweisen; nur Entscheidungsgrundlage, bislang nicht für dieses Projekt gewählt. |

## Aus der Recherche abgeleitete Empfehlungen

- PWA statt einer lokal geöffneten Einzeldatei für den iOS-Schwerpunkt.
- Google Drive direkt anbinden, um die gewählte vorhandene Cloud zu nutzen.
- Frühe Probe auf echtem iPhone, bevor der Komfort automatischer Synchronisation zugesagt wird.
- Lernereignisse und Vokabeländerungen so modellieren, dass parallele Offlinearbeit nicht still überschrieben wird.

Diese Empfehlungen sind technische Schlussfolgerungen für den Entwurf, keine Aussagen der Quellen über dieses konkrete Repository.
