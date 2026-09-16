# Übergabe: bestätigter Entwurf und Entwicklungsstart

**Abgelöst durch die [Pausenübergabe](2026-09-16-pause.md):** Nach dem geprüften Task-1-Zwischenstand hat der Nutzer Push und Pause für heute angeordnet.

Stand: 16.09.2026. Diese Übergabe ersetzt den nächsten Schritt der [Anforderungsklärung](2026-09-16-anforderungsklaerung.md).

## Auftrag und Bestätigung

Der Nutzer hat den Gesamtentwurf einschließlich E01–E10 mit Option A angenommen. Entwicklung und Projektdokumentation einschließlich GitHub-Übertragung sind beauftragt. Keine neue allgemeine Startgenehmigung oder erneute Abstimmung bereits bestätigter Anforderungen einholen.

Die Umsetzung beginnt mit einer begrenzten technischen Google-/iOS-Probe. Der komplette Trainer einschließlich Lernlogik, drei Modi, Erwachsenenbereich und Inselreise folgt nach dieser Machbarkeitsprüfung. Der Plan bildet keine automatische Zustimmung zu Kontenänderungen, kostenpflichtigen Diensten, öffentlichem Hosting oder einer Lizenzfreigabe.

## Arbeitskopie und Plan

- Ausgangspunkt: `707d504` auf `main` enthält die Entwurfsbestätigung und den Umsetzungsplan.
- Entwicklungszweig: `codex/google-drive-probe`, separate Arbeitskopie unter `.worktrees/drive-probe/` im ursprünglichen Checkout.
- Auf einem anderen System genügt ein normaler Clone und Wechsel auf diesen Entwicklungszweig; der lokale Worktree-Pfad ist keine Voraussetzung.
- [Implementierungsplan](../superpowers/plans/2026-09-16-google-drive-probe.md), [bestätigter Entwurf](../superpowers/specs/2026-09-16-vokabeltrainer-design.md), [Einrichtung und Prüfschritte](../GOOGLE-DRIVE-PROBE.md).
- Aktuellen Commit, lokale Änderungen und Remote wie in [START-HIER.md](../../START-HIER.md) prüfen. Keine automatische Zusammenführung mit `main` voraussetzen.

## Noch offene äußere Voraussetzungen

Die Frage nach einer bereits vorhandenen Google-Cloud-/OAuth-Registrierung wurde gestellt. Bis zu einer Nutzerantwort keine Registrierung oder öffentliche Client-ID erfinden. Ein Passwort, Client-Secret oder Dienstkontoschlüssel wird nicht benötigt. Eine tatsächlich eingerichtete Client-ID gehört in die lokale Probe-Konfiguration, nicht als Beispieldatum ins Repository.

Für echte iOS-Prüfungen fehlen Modelle, Betriebssystemversionen, Testverfügbarkeit und eine abgestimmte HTTPS-Bereitstellung. Der Nutzer besitzt keine Apple-Geräte, der künftige Hauptnutzer besitzt iPhone und iPad. Keine eigenmächtige Kontaktaufnahme. Fehlende technische Nachweise dürfen nicht durch simulierte Tests geschlossen werden.

## Wiedereinstieg

> Lies AGENTS.md, ARBEITSSTAND.md und diese Übergabe. Der Nutzer hat den Gesamtentwurf einschließlich E01–E10 bestätigt; beginne keine neue Produktabstimmung. Prüfe den Entwicklungszweig codex/google-drive-probe, den Plan und vorhandene Prüfbelege. Führe die frühe Drive-/iOS-Probe mit synthetischen Daten weiter. Erhalte offene Google-/Geräteprüfungen als offen und unterscheide die technische Testoberfläche vom noch zu entwickelnden Vokabeltrainer.
