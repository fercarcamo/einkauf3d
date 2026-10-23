# P2P Process Observatory

Interaktive lokale Three.js-Visualisierung von `P2P.csv`.

## Start

```sh
npm install
npm start
```

Anschließend http://localhost:8000 öffnen. Zum Beenden im Terminal Strg+C.
Node.js und Python 3 werden benötigt. Die Original-CSV bleibt unverändert.

## Bedienung und Bedeutung

- Abspielen, pausieren, Zeitregler verschieben und Tempo ändern.
- Ziehen dreht die Kamera, Scrollen zoomt. „Ansicht zurücksetzen“ stellt die Kamera zurück.
- Bestellung im Menü oder per Klick auf ein bewegtes Objekt wählen; rechts erscheinen alle protokollierten Ereignisse und ihre Zeitabstände.
- Jedes bewegte Objekt steht für eine Bestellung zwischen ihrem ersten und letzten protokollierten Ereignis. Vorher und danach wird sie ausgeblendet. „Aktuell aktiv“ meint diesen beobachteten Zeitraum, nicht einen fachlich bestätigten Status.
- Zwischen Ereignissen bleibt das Objekt beim letzten protokollierten Schritt. Eine kurze illustrative Übergabe endet exakt zum Folgeereignis. Getrennte Plätze und Ringe machen parallele Bestellungen sichtbar.
- Fehlende Aktivitäten werden übersprungen. Das letzte Ereignis wird nicht automatisch als Zahlung oder erfolgreicher Abschluss interpretiert.
- CSV-Felder: `Order_ID`, `Activity`, `Timestamp`. Zeitangaben ohne Zeitzone werden unverändert angezeigt. Ereignisse werden pro Bestellung chronologisch sortiert.
- Alle CSV-Daten bleiben lokal. Die Ansicht verwendet lokale Systemschriften. Three.js liegt nach `npm install` lokal vor.

Die neun bekannten Aktivitäten sind in `app.js` definiert. Unbekannte Aktivitäten oder ungültige Zeitangaben erzeugen eine sichtbare Fehlermeldung.

## Szenen und Transportmittel

Die Stationen zeigen Fachbereich, Chef, Einkauf, Lieferant, Warenannahme, Warenprüfung, Fakturierung, Buchhaltung und Finanzen als kleine 3D-Szenen. Diese Rollen sind illustrative Zuordnungen, keine aus dem CSV ausgelesenen Zuständigkeiten.

Zwischen „Send Purchase Order to Supplier“ und „Receive Goods“ fahren LKWs. Fehlt der Wareneingang im Log und folgt direkt die Warenprüfung, fährt der LKW bis zur Warenprüfung. Der LKW wartet bis zur kurzen Übergabeanimation am Lieferanten; diese Animation belegt keine tatsächliche Fahrtdauer. Andere Abschnitte verwenden Dokumente, Pakete oder Münzen. Fahrspuren trennen gleichzeitig laufende Vorgänge. Alle aktiven Objekte erhalten einen farbigen Ring, das ausgewählte Objekt einen weißen Ring.

Die Modelle entstehen lokal aus Three.js-Geometrien und benötigen keine externen Bild- oder Modelldateien.

## Bestellfilter und P2P-Kennzahlen

Anklickbare Filter: alle Bestellungen, Maverick-Verdacht, alle neun Schritte vorhanden, fehlende Schritte, Zahlung im Log und keine Zahlung im Log. Ein Filter ist jeweils aktiv und lässt sich mit einer Suche nach Bestell-ID kombinieren. Zähler zeigen die Treffer pro Filter unter Berücksichtigung der Suche. „Filter zurücksetzen“ stellt die Gesamtansicht wieder her. Das Auswahlmenü bietet die Bestellungen aus dem aktuellen Filter an. Eine konkrete Bestellauswahl begrenzt Szene, Zeitleiste und Kennzahlen zusätzlich auf diesen Vorgang. „Alle aus aktuellem Filter“ hebt diese Eingrenzung auf. Ein Klick auf einen Bestellfilter oder eine Änderung der Suche hebt die Einzelauswahl ebenfalls auf.

Maverick Buying wird als **Verdacht**, nicht als bewiesener Regelverstoß gewertet: Bei einer protokollierten Bestellanlage fehlt eine Bedarfsanforderung oder Freigabe bis einschließlich Bestellzeitpunkt, oder ein Wareneingang bzw. eine Rechnungsanlage liegt davor. Bestellungen ohne Bestellanlage sind dafür nicht beurteilbar. Der Nenner der Verdachtsquote sind nur beurteilbare Bestellungen. Datenlücken können die Verdachtsfälle erklären. Die jeweilige Begründung steht in den Bestelldetails.

Die sechs Kennzahlen beziehen sich auf den **gesamten Log der Filterauswahl**:

- Maverick-Verdachtsquote mit Anzahl beurteilbarer Bestellungen.
- Mittlere Durchlaufzeit: erste Bedarfsanlage bis zur ersten folgenden Zahlung.
- Mittlere Beschaffungszeit: erste Bestellanlage bis zum ersten folgenden Wareneingang.
- Mittlere Zahlungszeit: erste Rechnungsanlage bis zur ersten folgenden Zahlung.
- Anteil der Bestellungen mit protokollierter Zahlung.
- Anteil der Bestellungen mit allen neun Aktivitäten, unabhängig von ihrer Reihenfolge.

Dauern sind Kalendertage. Fehlende oder zeitlich ungültige Paare gehen nicht in den Mittelwert ein. Jede Dauer nennt ihre Fallzahl; ohne gültige Fälle erscheint „—“. Keine Zahlung im Log bedeutet nicht automatisch überfällig oder unbezahlt.

Die separate Wiedergabezeile zeigt gestartete und aktive Bestellungen, protokollierte Zahlungen und Ereignisse **bis zum aktuellen Wiedergabezeitpunkt** innerhalb derselben Filterauswahl. Die Klassifikation der Filter nutzt den gesamten Log und kann somit später protokollierte Ereignisse berücksichtigen. Die Zeitleiste verwendet den Zeitraum der aktuellen Wiedergabeauswahl. Bei einer Auswahländerung springt sie zu deren erstem Ereignis.

Prüfen: `npm run check` und `npm test` (inklusive Auswertung der mitgelieferten CSV).

## Parallele Wiedergabe und Engpassindikatoren

Alle gefilterten, zum aktuellen Log-Zeitpunkt laufenden Bestellungen sind gleichzeitig markiert. Eine Einzelauswahl spielt ausschließlich diesen Vorgang ab; ohne Einzelauswahl werden alle Vorgänge des aktuellen Filters gemeinsam wiedergegeben. Reihenfolge, Rücksprünge und ausgelassene Stationen folgen den chronologisch sortierten Ereignissen. Farbige Verbindungslinien zeigen die aktuell beobachteten Übergänge auch abseits des Standardpfades.

Bis zum Folgeereignis zählt ein Vorgang zum Bestand **nach** seinem letzten protokollierten Schritt. Der Übergang wird in den letzten 12 Prozent des Ereignisabstands, höchstens 0,35 Log-Tagen, kurz animiert. Das ist eine Darstellungskonvention und keine gemessene Transportdauer. Bei identischen Zeitstempeln gilt der letzte Eintrag in CSV-Reihenfolge.

Live-Badges über Stationen und eine Rangliste zeigen Bestände sowie mittlere verstrichene Kalendertage seit dem letzten Ereignis. Orange hebt den höchsten Bestand hervor (bei Gleichstand alle betroffenen Stationen); rote Vorgangsringe kennzeichnen das Erreichen der einstellbaren Dauergrenze. Die weiße Auswahlmarkierung hat Vorrang. Hoher Bestand und lange Verweildauer sind Engpassindikatoren; Bearbeitungszeit, Wartezeit und Kapazität lassen sich aus diesen Zeitstempeln allein nicht trennen.

Nach dem letzten Ereignis wird eine Bestellung nicht länger als aktiver Bestand gezählt. Vorgänge ohne protokollierte Zahlung am Ende ihres Verlaufs werden separat als unbekannter Endstatus gezählt, ohne unendlich wachsende Wartezeiten zu unterstellen. Noch nicht gestartete Bestellungen erscheinen erst zu ihrem ersten Ereignis.

## Einheitliche Wiedergabeauswahl und stabiles Layout

Bestellfilter und ID-Suche bestimmen das Angebot rechts. Dort kann ein einzelner Vorgang gewählt werden; auch ein Klick auf ein bewegtes Objekt wählt diesen für die Wiedergabe aus. Szene, aktuelle Stationsbestände, Rangliste, Kennzahlen und Zeitgrenzen nutzen dieselbe effektive Auswahl. Die Beschriftung „WIEDERGABE“ nennt die aktive Auswahl. Leere Ergebnisse deaktivieren Wiedergabe und Zeitleiste. Ein Vorgang ohne zeitliche Ausdehnung besitzt keine abspielbare Zeitspanne.

Die Bestandsanzeige besitzt eine feste Höhe und zeigt alle neun Stationen, auch mit Nullbestand. Lange Inhalte werden innerhalb des Bereichs gescrollt. Titel und Wiedergabezusammenfassung belegen feste Flächen, damit sich Szene und Bedienung bei wechselnden Zahlen und Beständen nicht verschieben.

## 16:9-Aufnahmeansicht

Die Oberfläche verwendet eine feste logische Bühne von 1600 × 900 und skaliert proportional in das Browserfenster. Bei 1920 × 1080 oder 1280 × 720 füllt sie die Fläche vollständig; andere Seitenverhältnisse erhalten freie Ränder. Die Seite selbst scrollt nicht. Die 3D-Ansicht und die Wiedergabesteuerung bleiben an festen Positionen.

- Oben: Bestellfilter als Dropdown, ID-Suche, Vorgangsauswahl, Zurücksetzen, Definitionen und Vollbild.
- Darunter: sechs Kennzahlen in einer kompakten Zeile.
- Mitte: große 3D-Szene und eine schmale Seitenleiste mit klappbaren Engpassindikatoren bzw. Ereignisverlauf. Ein ausgewählter Vorgang öffnet seinen Verlauf; die Gruppenansicht öffnet die Bestandsanzeige.
- Unten: Abspielen, Datum, Live-Zusammenfassung, Geschwindigkeit und Zeitleiste.
- Definitionen erscheinen als schließbarer Dialog. Zusätzliche Erklärungen sind eingeklappt. Lange Detailverläufe lassen sich nur innerhalb der Seitenleiste scrollen.

Für eine Aufnahme „Vollbild“ wählen und eine Bildschirmauflösung mit 16:9 verwenden, z. B. 1920 × 1080. Der Knopf aktiviert Browser-Vollbild; er startet keine Videoaufnahme. Falls die Umgebung Vollbild blockiert, die Vollbildfunktion des Browsers nutzen. Die Aufnahme erfolgt mit einem separaten Bildschirmaufnahmeprogramm.

## Veröffentlichung auf GitHub Pages

Das Projekt ist für ein öffentliches GitHub-Repository mit Branch `main` vorbereitet. Die mitgelieferte CSV enthält öffentliche Beispieldaten.

1. In GitHub unter **Settings → Pages → Build and deployment → Source** die Option **GitHub Actions** wählen.
2. Die Projektdateien einschließlich `.github/workflows/pages.yml` und `scripts/build.mjs` in `main` veröffentlichen. `node_modules`, `dist` und lokale ZIP-Archive werden nicht eingecheckt.
3. Der Workflow installiert mit `npm ci` die festgeschriebenen Abhängigkeiten, prüft Syntax und Berechnungen, baut das Veröffentlichungspaket und stellt es auf GitHub Pages bereit.
4. Die fertige Adresse erscheint unter **Actions → Publish Process Observatory → deploy** und unter **Settings → Pages**.

Bei jeder Änderung an `main` aktualisiert sich die Website automatisch. Änderungen im lokalen Ordner allein aktualisieren sie noch nicht.

Der Build `npm run build` erzeugt `dist/` mit einer expliziten Liste öffentlicher App-Dateien, der Beispiel-CSV und lokal bereitgestelltem Three.js samt Lizenz. Die Importpfade sind relativ und funktionieren deshalb auch unter `/einkauf3d/`. Es werden kein CDN, Python auf dem Hostingserver und keine geheimen Zugangsschlüssel benötigt.

Lokale Vorschau des Veröffentlichungspakets:

```sh
npm ci
npm run build
npm run preview
```

Anschließend http://localhost:8000 öffnen.
