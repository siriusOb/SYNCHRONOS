SYNCHRONOS — 전체 웹사이트 / COMPLETE 58 / FAST LOADING

이 폴더 하나에 실행에 필요한 웹 파일, 이미지, 그래픽, 서체, 원본 책·포스터 PDF, PDF 표시 라이브러리가 모두 들어 있습니다.

1. ZIP을 새 위치에 압축 해제합니다. 기존 패치 폴더와 합치지 않아도 됩니다.
2. 폴더 안 START.command를 더블클릭합니다. 브라우저가 자동으로 열립니다.
3. 실행 중에는 열린 터미널 창을 유지합니다. Control+C로 종료할 수 있습니다.

START.command가 열리지 않으면 터미널에서 이 폴더로 이동한 뒤 아래 명령을 실행합니다.
python3 -m http.server 4174 --bind 127.0.0.1
그런 다음 http://127.0.0.1:4174/ 를 엽니다.

index.html을 파일로 직접 열면 PDF·그래픽 데이터 읽기가 차단될 수 있으므로 위 로컬 링크로 확인합니다.

GitHub Pages 발행 시:
이 폴더 내부의 index.html, CSS·JS·MJS 파일과 assets 폴더를 같은 위치에 올립니다. assets 폴더를 나누거나 이름을 변경하지 않습니다. START.command와 이 안내 파일은 웹 실행에 필수가 아닙니다.

ATLAS: 12개의 원본 엽서와 책·질병 설명의 연결.
ARCHIVE: 원본 40쪽 책 PDF와 포스터 PDF. 책의 넘김 모션 유지.
SELF-PORTRAIT: 6개의 선택, 그래픽 순차 등장, 마지막 등장 후 1초 대기, 초상 결과 및 PNG 저장.
VARIANT: 그래픽 추가·선택·이동, 개별 옵션 조절, 상단 고정 PNG 저장.

American Typewriter Regular / X Typewriter Regular 웹 서체 포함.
서체·종이 질감의 출처 표기는 assets/fonts/FONT-NOTICE.txt 및 assets/TEXTURE-CREDITS.txt 참조.

로딩 개선 58: 아틀라스·질문·선택 목록에는 가벼운 미리보기를 사용하고, 원본 벡터는 선택한 그래픽만 읽습니다. 결과와 PNG 저장은 원본 벡터를 유지합니다.
