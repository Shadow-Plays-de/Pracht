![](https://img.shields.io/badge/Foundry-v14-informational)

# SR5 - Pracht

**SR5 - Pracht** ist ein Foundry VTT v14 Modul für das Shadowrun 5e System, das die Spezialregeln für **Engel der Erneuerung** mit den Attributen **Pracht** und **Funke** nativ in den Charakterbogen integriert.

---

## 📜 Regelwerk (Ruleset)

### Pracht
- **Pracht** wird ähnlich wie Magie oder Resonanz genutzt.
- Der Startwert setzt sich einmalig aus den zwei höchsten körperlichen und/oder geistigen Attributen des Charakters zusammen.
- Anschließend kann Pracht über Karma wie ein normales Attribut gesteigert werden.

### Funke (Submersion / Entzug)
- **Funke** dient als Entzugsattribut für Pracht-Handlungen.
- Der Basiswert von Funke wird dynamisch aus der **Summe der beiden höchsten körperlichen und/oder geistigen Attribute** berechnet.
- Zu diesem Basiswert kommt ein veränderlicher **Funken-Modifikator** hinzu (`Gesamtwert = Basis + Modifikator`).
- Der Modifikator kann positiv oder negativ sein und über interaktive `[+]` und `[-]` Buttons direkt auf dem Charakterbogen angepasst werden.
- Bei Proben mit Pracht/Funke-Handlungen senkt jeder nicht geschaffte Erfolg (unter dem Schwellenwert) den Funken-Modifikator um je 1 Punkt.

### Aktionen & Fertigkeiten
Charaktere nutzen Pracht und Funke für spezielle Engel-Fähigkeiten (z.B. *Endloses Wissen*, *Materieerschaffen*, *Telekinese*, *Gedankenlesen*, *Luftpfeile*, *Feuerschwert*, *Erdbeben*, *Eislanze*):
- **Probe**: `Pracht (Stufe/Mindestwurf)`.
- **Entzug**: `Funke (Stufe)`. Fehlende Erfolge senken den Funken um je 1.

---

## 🛠️ Technische Umsetzung (Implementation)

- **Foundry VTT v14 & AppV2 Integration**: Das Modul erweitert die native `SR5CharacterSheet` Klasse um einen schlanken, platzsparenden **Pracht-Tab** (`<i class="fas fa-sun"></i>`).
- **Nativer Attributs- & Modifikator-Modus**:
  - Im **Edit-Modus** kann der Basiswert von Pracht direkt angepasst werden.
  - Im **Spiel-Modus** löst ein Klick auf den Pracht- oder Funke-Button direkt die entsprechende Attributsprobe aus.
- **Dynamic Modifier Controls**: Neben dem Funke-Wert befinden sich grüne `[+]` und rote `[-]` Buttons sowie ein farbiges Badge `(+X)` / `(-X)` zur schnellen Anpassung des Modifikators.
- **Roll Dialog Integration (`sr5_testPrepareBaseValues`)**: Modifikatoren werden transparent als gekennzeichnete Eintragszeile (`Funke-Modifikator: -1`) in die Würfelpool-Berechnung von Attributsproben und Pracht-Aktionen injiziert.
- **Automatischer Entzug (`sr5_afterTestComplete`)**: Nicht geschaffte Erfolge bei Pracht-Aktionen verringern den Funken-Modifikator automatisch.
- **System-Übersetzungen**: Alle System-Bezeichnungen für *Resonanz* und *Wandlung* werden modulweit sauber auf *Pracht* und *Funke* gemappt.

---

## ⚙️ Vite Build & GitHub Actions Workflow

Das Modul nutzt **Vite** & `@tailwindcss/vite` für extrem schnelle Builds. Der GitHub Release Workflow baut das Modul aus `dist/` und erstellt automatisch:
- `module.json` (mit injizierter Tag-Version & Release-Links)
- `module.zip` (Vollständiges Archiv für die Foundry-Installation)

---

## 🙏 Danksagung & Credits

Ein besonderer Dank geht an das Entwickler-Team des **Shadowrun 5e Foundry VTT System** für ihre fantastische Arbeit und das Open-Source-System:
- **Shadowrun 5e System Repository**: [https://github.com/SR5-FoundryVTT/SR5-FoundryVTT](https://github.com/SR5-FoundryVTT/SR5-FoundryVTT)