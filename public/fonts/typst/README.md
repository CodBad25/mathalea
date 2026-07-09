# Polices Typst (vue Typst)

Polices libres chargées par le compilateur Typst (aperçu navigateur et export
PDF) et par la compilation CLI des tests (`--font-path`). Le compilateur WASM
n'embarque que Libertinus Serif et New Computer Modern ; ces fichiers ajoutent
des polices de texte et de mathématiques supplémentaires.

Toutes sont sous licence **SIL Open Font License 1.1** (100 % libres), texte
de licence fourni à côté de chaque police (`OFL-*.txt`).

| Fichier | Famille | Type | Source (Google Fonts) |
| --- | --- | --- | --- |
| `NotoSans.ttf` | Noto Sans | texte sans | ofl/notosans |
| `NotoSerif.ttf` | Noto Serif | texte serif | ofl/notoserif |
| `Lora.ttf` | Lora | texte serif | ofl/lora |
| `SourceSans3.ttf` | Source Sans 3 | texte sans | ofl/sourcesans3 |
| `NotoSansMath.ttf` | Noto Sans Math | maths sans | ofl/notosansmath |
| `STIXTwoMath.ttf` | STIX Two Math | maths serif | ofl/stixtwomath |

Les familles proposées dans les réglages sont listées dans
`src/components/setup/typst/buildTypstDocument.ts` (`TEXT_FONTS`, `MATH_FONTS`)
et préchargées dans `src/components/setup/typst/typstCompiler.ts`.
