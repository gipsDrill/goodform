# Nakładka Nebula — płynniejsza pętla przy 50%

Aktualizacja: 23 października 2026. Baza poprawki pętli: `7fb3a5e`.

## Zachowane ustawienia

Widoczność wynosi dokładnie `opacity: 0.50` po łagodnym wejściu 1,5 s.
Tryb mieszania `screen`, warstwowanie pod treścią i brak przechwytywania kliknięć
pozostają bez zmian. Dodatkowe przyciemnienie tła: 0%.

Pliki i ustawienia dotychczasowego tła nie są zmieniane: `script.js`,
`styles.css`, `css/bg-layers.css`, `js/network-bg.js`, `js/drift-cluster.js`
oraz część inicjalizująca tła w `js/site-layers.js`.

## Poprawa zapętlenia

Poprzednia wersja v2 miała jednosekundowe przenikanie liniowe i 9-sekundowy cykl.
Przy zwiększeniu widoczności do 50% połączenie było widoczne. Wcześniejsze
kryteria pomiaru przy 8% nie wystarczały do oceny obecnego wyglądu.

Nowa wersja v3 używa przenikania 3,2 s z krzywą quintic smootherstep:
`6t^5 - 15t^4 + 10t^3`. Przenikanie zaczyna się i kończy z zerową pierwszą
oraz drugą pochodną wagi. Nie ma zaniku nakładki do czerni.

Połączenie przeniesiono na spokojniejszy fragment w t=3,2 s oryginału,
wybrany na podstawie analizy sąsiednich klatek. Cykl zaczyna się od t=3,2 s źródła.
Źródło 6,8–10 s przenika w 0–3,2 s; połączenie pętli wypada między sąsiednimi
klatkami wokół t=3,2 s. Cykl ma 6,8 s, przy oryginalnej prędkości ruchu.

Na życzenie użytkownika odtwarzanie całej nebuli zwolniono najpierw o 20%,
a następnie o kolejne 20% względem poprzedniej prędkości:
`defaultPlaybackRate = playbackRate = 0.64` (0.8 × 0.8).
Cykl na stronie trwa więc 10,625 s, a przenikanie 5 s.
Widoczność pozostaje na 50%. Spowolnienie dotyczy wyłącznie
nebuli; nie zmienia istniejących animacji tła i nie wymaga kolejnej kompresji filmu.

Przejście zapisano bezpośrednio w MP4. Produkcja nadal używa jednego elementu
video i jednego dekodera, bez pętli animacyjnej JavaScript i bez kopiowania
filmu do canvas. Nowe nazwy filmów oraz wersje URL loadera zapobiegają użyciu
poprzednich plików z cache. Oba filmy v2 zastąpiono plikami v3.

## Źródło i format

Użyto tego samego nowego załącznika `Nebula.mp4` z rozmowy: 10 s, 600 klatek,
2560×1440 przy 60 fps. SHA-256 oryginału:
`66acbe75b68849eee97ed3ef432656f89278e67f1a9acab9040245a3b03feefe`.

| Wariant | Rozdzielczość | Klatkaż | Liczba klatek | Kompresja |
| --- | --- | --- | --- | --- |
| nebula-v3-1440p.mp4 | 2560×1440 | 60 fps | 408 | H.264 High, CRF 18, slow |
| nebula-v3-720p.mp4 | 1280×720 | 30 fps | 204 | H.264 High, CRF 14, slow |

Oba warianty: 6,8 s, yuv420p, BT.709 TV, brak audio, MP4 faststart.
Wariant mobilny, wyciszenie, odtwarzanie inline, pauza w ukrytej karcie,
obsługa ograniczenia ruchu/oszczędzania danych oraz fallbacki pozostają zachowane.

## Weryfikacja

`tools/verify-nebula.py` dekoduje wszystkie klatki i ocenia granicę przy
aktualnej widoczności 50%. Granica musi mieścić się w 95. percentylu zwykłych
zmian pomiędzy sąsiednimi klatkami, a nie tylko być mniejsza od najgorszego skoku.

`tools/test-nebula-loop.cjs` obserwuje klatki faktycznie prezentowane przez
przeglądarkę podczas trzech przejść końca w początek dla każdego wariantu.
Sprawdza różnicę obrazu, przerwy między klatkami i brak błysku do czerni.
Odczyt testowy przez canvas służy wyłącznie pomiarowi; strona go nie używa.

`tools/test-nebula.cjs` sprawdza 10 stron, widok mobilny, menu, warstwowanie,
widoczność 50%, odtwarzanie i zachowanie po błędach/zmianach preferencji.
`tools/compare-nebula-screenshots.py` porównuje zamrożony obraz z nakładką i bez.
Nie jest to test fizycznego iPhone'a, Androida ani Safari.

## Odtworzenie

```sh
python tools/prepare-nebula.py Nebula.mp4 --ffmpeg /path/to/ffmpeg
python tools/verify-nebula.py --report media-verification-v3.json
node tools/test-nebula.cjs
node tools/test-nebula-loop.cjs
python tools/compare-nebula-screenshots.py test-results
```

Potrzebne: FFmpeg 7+ z libx264, Python z PyAV/numpy/Pillow oraz Node z
Playwright i Edge. `QA_OUTPUT` wybiera folder raportów i zrzutów.
Publikacja korzysta z istniejącego GitHub Pages dla `main`.

### Wyniki przed publikacją

Edge 155.0.4283.62: 23 kontrole funkcjonalne przeszły; brak błędów JavaScript.
Zdekodowano wszystkie 408 + 204 klatki. W porównaniu zamrożonych zrzutów
zero kanałów zostało przyciemnionych (min 0, max +125 w skali 0–255).

| Wariant | Stara różnica na granicy | Nowa różnica | Zmniejszenie | 95. percentyl zwykłych zmian w nowym filmie |
| --- | --- | --- | --- | --- |
| Desktop | 0,6609 | 0,3408 | 48,4% | 0,4142 |
| Mobile | 1,1854 | 0,4658 | 60,7% | 0,5907 |

Pomiar RGB po zmniejszeniu do 256×144. Przy widoczności 50% średni wpływ
samej granicy wynosi najwyżej 0,1704 / 0,2329 jednostki kanału RGB.
Nowa granica jest łagodniejsza niż 95. percentyl zwykłych zmian w filmie.
To pomiar laboratoryjny; nie stanowi gwarancji percepcyjnej na każdym ekranie.

Desktop ma 6 257 559 B, mobile 3 508 446 B. Wariant mobilny otrzymał łagodniejszą
kompresję (CRF 14), ponieważ przy 50% widoczności ujawniały się różnice
kodowania pierwszych i ostatnich klatek przy poprzednim CRF 19.

Dodatkowy test prezentowanych klatek przeszedł dla obu wariantów przez trzy
kolejne powroty pętli przy `playbackRate=0.8`. Nie wykryto błysku do czerni.
Średnia różnica w rastrze przeglądarki 128×72 na połączeniu przy 50% wyniosła
0,374 / 0,415 jednostki kanału RGB. To inna metoda skalowania niż pomiar PyAV
powyżej, dlatego tych liczb nie należy ze sobą utożsamiać.
