# Nakładka Nebula — przygotowanie i testy

Stan: 23 października 2026. Zmiana przygotowana na gałęzi
`codex/subtle-nebula-overlay`, bez wdrożenia i bez zmiany `main`.
Baza: `e934a5f`.

## Wygląd i pliki

Widoczność nebuli: **3%** (`opacity: .03`), mieszanie **screen**.
Dodatkowe przyciemnienie: **0%**. Czerń filmu jest neutralna w tym trybie.
Nie zmieniono istniejących ustawień jasności, kolorów ani animacji tła.
`script.js`, `styles.css`, `css/bg-layers.css`, `js/network-bg.js`
i `js/drift-cluster.js` pozostały identyczne z bazą.

| Plik | Rola |
| --- | --- |
| `js/site-layers.js` | Dopisany niezależny loader; uruchamia nakładkę dopiero po załadowaniu jej CSS. |
| `css/nebula-overlay.css` | Stała warstwa za treścią, screen, 3%, bez przechwytywania kliknięć. |
| `js/nebula-overlay.js` | Jeden odtwarzacz, wybór wariantu, opóźniony start i obsługa preferencji/błędów. |
| `assets/video/nebula-1080p.mp4` | Wariant desktopowy. |
| `assets/video/nebula-720p.mp4` | Wariant mobilny i dla urządzeń z małą pamięcią. |
| `tools/prepare-nebula.py` | Odtworzenie obu plików z dostarczonego oryginału. |
| `tools/verify-nebula.py` | Dekodowanie wszystkich klatek i pomiar granicy pętli. |
| `tools/test-nebula.cjs` | Testy przeglądarkowe oraz zrzuty. |
| `tools/compare-nebula-screenshots.py` | Pomiar braku przyciemnienia i limitu widoczności. |

Nakładka działa na wszystkich 10 publicznych stronach używających wspólnego
`site-layers.js`. Archiwalny katalog `goodform-logo-home-fix-ready`, strony
`preview-*` i osobny projekt `juniper-stone` pozostają bez zmian.

## Rzeczywiste parametry

Źródło: `Nebula Animation in Blender (2160p_30fps_VP9-128kbit_AAC)_1_apo8_prob4.mp4`.
Plik odnaleziono w załączniku rozmowy; ścieżka `/mnt/data/…` dotyczyła poprzedniego
środowiska. Użyto tego załącznika, bez pobierania zamiennika z YouTube.

| Parametr | Źródło | Desktop | Mobile |
| --- | --- | --- | --- |
| Rozdzielczość | 3840×2160 | 1920×1080 | 1280×720 |
| Klatkaż | 60 fps | 60 fps | 30 fps |
| Liczba klatek | 1671 | 1680 | 840 |
| Czas obrazu | 27,85 s | 28,00 s | 28,00 s |
| Rozmiar | 189 572 445 B | 9 809 905 B | 3 621 857 B |
| Kodek obrazu | H.264 | H.264 High | H.264 High |
| Dźwięk | AAC 128 kb/s | brak | brak |
| Kompresja | ok. 54,3 Mb/s | CRF 20, preset slow | CRF 21, preset slow |
| Kolor | BT.709, zakres TV | BT.709, zakres TV | BT.709, zakres TV |
| Format pikseli | yuv420p | yuv420p | yuv420p |
| Szybki start MP4 | — | moov przed mdat | moov przed mdat |

Cały kontener źródłowy trwa 28,119138 s z powodu dłuższego audio. Nazwa pliku
jest myląca: rzeczywisty kodek to H.264, a klatkaż 60 fps. Metadane źródła
informują, że wcześniej przeliczono klatkaż do 60 fps przez interpolację.
Nie jest to potwierdzenie natywnego nagrania 60 fps.

Wersja 4K nie jest wysyłana do przeglądarki. Przy widoczności 3% wariant 1080p
zachowuje subtelne detale przy znacznie niższym koszcie dekodowania i transferu.
Źródło pozostaje bez zmian poza repozytorium.

## Pętla i wydajność

Oryginał nie jest seamless. Dwusekundowy crossfade ostatnich klatek z pierwszymi
zapisano w samym pliku. Cykl zaczyna się od t=2 s źródła, następnie przechodzi
z końca do t=0…2 s, więc granica pętli wypada pomiędzy sąsiednimi klatkami
około t=2 s. Cykl 25,85 s wydłużono do dokładnie 28 s (prędkość 92,32%
oryginału). Crossfade po tym przeliczeniu trwa około 2,17 s.

Przeglądarka używa jednego elementu wideo i jednego dekodera; nie ma dwóch
filmów, pętli JavaScript ani renderowania filmu do canvas. Wideo jest wyciszone,
odtwarzane inline, dekoracyjne i wyłączone z obsługi klawiatury. Start następuje
po załadowaniu strony i w wolnej chwili. Nakładka łagodnie pojawia się przez 1,5 s.

Wariant 720p wybierany jest dla szerokości do 900 px, głównego wskaźnika dotykowego
lub raportowanej pamięci urządzenia do 4 GB. Wybór następuje raz, bez ponownego
pobierania przy obrocie telefonu. W tle karty wideo jest pauzowane.

Przy `prefers-reduced-motion`, `saveData`, połączeniu 2G albo braku obsługi screen
film nie jest pobierany. Zmiana preferencji ruchu usuwa odtwarzacz i zwalnia jego
źródło. Brak filmu, brak CSS lub blokada autoplay pozostawiają dotychczasowe tło.

## Wyniki testów

**Edge 155.0.4283.62, Windows, tryb headless: 23 kontrole zakończone powodzeniem.**
Widok desktopowy 1440×960, mobilny 390×844 z emulacją dotyku.

- Na wszystkich 10 stronach film odtwarza się za treścią i za nagłówkiem,
  nad oboma istniejącymi canvasami; ma właściwe parametry i neutralną obsługę kliknięć.
- Telefon otrzymuje wariant 720p; menu działa, nie ma poziomego przepełnienia.
- Ograniczenie ruchu, oszczędzanie danych, 2G i brak screen: zero żądań wideo.
- Blokada autoplay, błąd wideo 404 i brak CSS: bezpieczny, niewidoczny fallback.
- Sprawdzono rzeczywisty powrót z końca 28-sekundowego filmu do początku,
  obsługę zdarzeń pagehide/pageshow oraz zmianę preferencji ruchu podczas działania.
- Brak nieobsłużonych błędów JavaScript. Krótka próbka startowa dekodera:
  114 klatek, 2 pominięte; to wynik laboratoryjny, nie pomiar baterii ani telefonu.
- Porównanie nieruchomego widoku przed/po: **0 przyciemnionych kanałów**,
  różnica minimalna 0, maksymalna +8, średnia +1,064 w skali 0–255.
- Zdekodowano wszystkie 1680 + 840 klatek. Oba filmy mają dokładnie 28 s,
  prawidłowy klatkaż, brak audio i szybki start MP4.

Pomiar różnicy RGB między końcem a początkiem, po przeskalowaniu do 256×144:

| Materiał | Średnia różnica na granicy | Maks. różnica średnia między zwykłymi sąsiadami | Wpływ granicy przy 3% |
| --- | --- | --- | --- |
| Oryginał | 24,635 | — | — |
| Desktop | 0,646 | 1,644 | ≤0,0194 |
| Mobile | 0,806 | 1,679 | ≤0,0242 |

To pomiar numeryczny, a nie gwarancja percepcyjna na każdym ekranie. Przejście
jest dużo łagodniejsze niż zwykła pętla oryginału; sama granica mieści się
w zakresie zmian występujących pomiędzy innymi klatkami filmu.

**Granice weryfikacji:** nie testowano fizycznego Androida ani iPhone'a.
Dodatkowa próba Playwright WebKit 26.5 na Windows zatrzymała się przed
`loadedmetadata` (`readyState=0`, bez zgłoszonego błędu mediów), mimo deklarowanej
obsługi H.264. Ten test nie przeszedł i nie potwierdza zgodności z Safari.
Przed publikacją należy obejrzeć pętlę na rzeczywistym Safari/iOS oraz sprawdzić
płynność i pobór energii na docelowym telefonie.

## Odtworzenie testów

Narzędzia są potrzebne tylko do przygotowania i testów; witryna pozostaje statyczna.

```sh
python tools/prepare-nebula.py SOURCE.mp4 --ffmpeg /path/to/ffmpeg
python tools/verify-nebula.py --report media-verification.json
node tools/test-nebula.cjs
python tools/compare-nebula-screenshots.py test-results
```

Przygotowanie: Python + FFmpeg 7.1 z libx264. Weryfikacja mediów: PyAV + numpy.
Zrzuty: Node + Playwright + Edge; porównanie pikseli: Pillow + numpy.
`QA_OUTPUT` ustawia katalog raportów i zrzutów. Opcjonalnie `QA_BROWSER=webkit`
oraz `QA_WEBKIT_EXECUTABLE` wybierają instalację WebKit.

Zmiana oczekuje w osobnym pull requeście. Nie scalono jej do `main`,
nie wywołano wdrożenia i nie zmieniono konfiguracji hostingu.
