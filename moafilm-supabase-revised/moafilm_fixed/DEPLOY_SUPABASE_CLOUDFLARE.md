# 모아필름 Supabase + Cloudflare 수정본 (배포 전 테스트 필요)

## 무엇이 바뀌었나
- 기존 MP4 템플릿 편집/FFmpeg 코드 유지
- Python 백엔드 로그인/회원가입을 Supabase Auth REST API로 전환
- 관리자 여부는 **서버 환경변수 MOAFILM_ADMIN_EMAIL + Supabase 이메일 인증**으로만 결정
- Cloudflare Pages Functions로 /api, /backgrounds, /outputs를 HTTPS 백엔드로 프록시
- 고객 데이터/영상 파일은 여전히 Python 서버의 영구 볼륨에 저장해야 함

## 반드시 필요한 외부 서버
Cloudflare Pages만으로 Python/FFmpeg를 실행할 수 없습니다. Dockerfile로 **별도 컨테이너 서버**에 백엔드를 배포하세요. 서버 영구 볼륨 /data 필수.

백엔드 환경변수:
- SUPABASE_URL=https://ijsqhopfjlltkjanwkhb.supabase.co
- SUPABASE_PUBLISHABLE_KEY=Supabase Dashboard의 sb_publishable_... 키
- MOAFILM_ADMIN_EMAIL=gin77777@naver.com
- MOAFILM_HOST=0.0.0.0
- PORT=8890
- MOAFILM_DATA_DIR=/data
- MOAFILM_HTTPS=1
- MOAFILM_PUBLIC_ORIGIN=https://wedding-video-studio-v2.pages.dev
- MOAFILM_BOOTSTRAP_ADMIN=0

Cloudflare Pages Git 연동 프로젝트 설정:
- Root directory: moafilm-current-work (GitHub에 이 ZIP의 **내용**을 그 폴더로 업로드한 경우)
- Build command: exit 0
- Build output directory: site
- Functions 폴더는 프로젝트 루트의 functions/ 로 배치
- Settings > Variables and Secrets: MOAFILM_BACKEND_URL=https://실제-백엔드-도메인 (HTTPS)

## 중요
1. **Supabase 이메일 인증이 완료된** 관리자 이메일만 admin 권한을 받습니다.
2. 등록된 계정의 UID를 복사할 필요가 없습니다.
3. 서버/Cloudflare에 실제 배포한 것은 아닙니다. 서버 주소가 없으면 로그인은 작동하지 않습니다.
4. 로그인 세션은 Supabase 액세스 토큰 만료 후 재로그인이 필요합니다 (자동 갱신 미구현).
5. 비밀번호 재설정 메일 링크의 실제 사용자 흐름은 추가 작업/검증이 필요합니다.
6. `/api/checkout/mock`은 실제 결제 기능이 아닙니다. 공개 상용 운영 금지.
7. 대용량 렌더링/동시접속, 권한/개인정보/파일 업로드 보안은 실제 환경에서 추가 검증이 필요합니다.
