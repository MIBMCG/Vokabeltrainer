# Unveränderte v1-Testquellen

Originalbytes aus Produktcommit `cc079cbea31d6d834b7d8eba1920486daddb4e90`.
`source-manifest.json` enthält die transitive relative Importmenge von Commands,
Packets und Sync einschließlich SHA-256 und Bytezahl. Diese Module verwenden
einen injizierten Driveadapter und importieren kein weiteres `src/drive`-Modul.
Die Tests verwenden ausschließlich synthetischen Drive und benötigen weder Git
noch Netz zur Laufzeit. Quellen nicht an die aktuelle Implementierung anpassen.
