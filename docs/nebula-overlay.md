# Nakładka Nebula — nowy klip, 8%

Aktualizacja: 23 października 2026. Baza zmiany: `8aab29c`.

## Wprowadzone zmiany

Poprzednie filmy `nebula-1080p.mp4` i `nebula-720p.mp4` usunięto z bieżącego
repozytorium. Zastępują je warianty NOWEGO załącznika `Nebula.mp4`.
Widoczność nakładki wynosi dokładnie `opacity: 0.08` po łagodnym wejściu 1,5 s.
Tryb `screen` zachowuje neutralną czerń. Dodatkowe przyciemnienie wynosi 0%.

Kod i ustawienia istniejącego tła nie zostały zmienione: `script.js`,
`styles.css`, `css/bg-layers.css`, `js/network-bg.js`, `js/drift-cluster.js`
oraz część inicjalizująca tła w `js/site-layers.js` są identyczne z bazą
(po normalizacji końców linii). W loaderze nakładki dodano wersję URL CSS i JS,
a nowe nazwy filmów zapobiegają użyciu poprzedniego klipu z pamięci podręcznej.

Wideo jest po obu canvasach (z-index 0) i pod zawartością (main: 1,
nagłówek: 100); nie przechwytuje kliknięć. Nakładka działa na wszystkich
10 publicznych stronach korzystających ze wspólnego `js/site-layers.js`.

## Źródło i przygotowane pliki

Użyto załącznika `Nebula.mp4` odczytanego z poprzedniej rozmowy, bez pobierania
zamiennika. Ścieżka `/mnt/data/Nebula.mp4` dotyczyła poprzedniego środowiska.
SHA-256 oryginalnego załącznika:
`66acbe75b68849eee97ed3ef432656f89278e67f1a9acab9040245a3b03feefe`.

| Parametr | Nowy oryginał | Desktop | Mobile |
| --- | --- | --- | --- |
| Plik | Nebula.mp4 | nebula-v2-1440p.mp4 | nebula-v2-720p.mp4 |
| Rozdzielczość | 2560×1440 | 2560×1440 | 1280×720 |
| Klatkaż | 60 fps | 60 fps | 30 fps |
| Czas | 10 s | 9 s | 9 s |
| Klatki | 600 | 540 | 270 |
| Rozmiar | 11 322 409 B | 7 356 921 B | 1 749 590 B |
| Kodek | H.264 + AAC | H.264 High, CRF 18 | H.264 High, CRF 19 |
| Audio | obecne | usunięte | usunięte |
| Kolor | BT.709, TV | BT.709, TV | BT.709, TV |

Oba warianty mają szybki start MP4 (`moov` przed `mdat`). Desktop zachowuje
pełną rozdzielczość i klatkaż nowego źródła. SSIM wersji desktopowej względem
oryginału poza zaplanowanym przejściem: **0,995335** (480 klatek, odcinek 8 s).
To obiektywny pomiar kompresji, nie gwarancja percepcyjna dla każdego ekranu.

## Pętla i obsługa mobilna

Cykl zaczyna się od t=1 s źródła. Ostatnia sekunda źródła (9–10 s) płynnie
przechodzi w pierwszą (0–1 s). Prędkość pozostaje oryginalna; jednosekundowe
nakładanie skraca cykl z 10 do 9 s. Przejście zapisano w pliku: działa jeden
odtwarzacz, bez dodatkowego dekodera i bez rysowania filmu do canvas.

Film jest wyciszony, dekoracyjny, odtwarzany inline i pomijany przez klawiaturę.
Wariant 720p wybierany jest przy szerokości do 900 px, wskaźniku dotykowym
lub raportowanej pamięci do 4 GB. Wideo pauzuje w ukrytej karcie.
Przy ograniczeniu ruchu, oszczędzaniu danych, 2G lub braku `screen` nie jest
pobierane. Błąd filmu/CSS lub odmowa autoplay zachowują oryginalne tło.

## Weryfikacja przed publikacją

Edge 155.0.4283.62, Windows: **23 kontrole PASS, zero błędów JavaScript**.
Desktop 1440×960; emulacja mobilna 390×844 z dotykiem.

- Wszystkie 10 stron: nowy film, prawidłowa rozdzielczość, warstwowanie,
  wyciszenie, inline, pętla i działające canvasy.
- Desktop i mobile: obliczona widoczność `0.08`.
- Mobile: wariant 720p, działające menu, brak poziomego przepełnienia.
- Ograniczenie ruchu, oszczędzanie danych, 2G i brak screen: zero żądań filmu.
- Odmowa autoplay, brak filmu i brak CSS: niewidoczny fallback.
- Rzeczywiste przejście końca 9-sekundowej pętli w początek, pagehide/pageshow
  i zmiana preferencji ruchu podczas działania.
- Zamrożone porównanie przed/po: zero przyciemnionych kanałów;
  różnica kanału RGB min 0, max +20, średnio +3,284 (skala 0–255).
- Zdekodowano wszystkie 540 + 270 klatek; poprawny format, czas i brak audio.
- Krótka próbka startowa dekodera: 115 klatek, 5 pominiętych;
  nie jest to długotrwały pomiar wydajności ani baterii.

Pomiar granicy pętli w RGB po przeskalowaniu do 256×144:

| Wariant | Średnia różnica na granicy | Maks. zwykła różnica sąsiednich klatek | Wpływ granicy przy 8% |
| --- | --- | --- | --- |
| Desktop | 0,661 | 1,164 | ≤0,0529 |
| Mobile | 1,185 | 1,281 | ≤0,0949 |

Granica mieści się w zakresie zmian występujących wewnątrz filmu.
Nie testowano fizycznego iPhone'a, Androida ani Safari w tym przebiegu.

## Odtworzenie

```sh
python tools/prepare-nebula.py NOWY_Nebula.mp4 --ffmpeg /path/to/ffmpeg
python tools/verify-nebula.py --report media-verification.json
node tools/test-nebula.cjs
python tools/compare-nebula-screenshots.py test-results
```

Potrzebne: FFmpeg 7+ z libx264, Python z PyAV/numpy/Pillow oraz Node z
Playwright i Edge. `QA_OUTPUT` wybiera folder raportów i zrzutów.
Publikacja korzysta z istniejącego GitHub Pages dla `main`.
