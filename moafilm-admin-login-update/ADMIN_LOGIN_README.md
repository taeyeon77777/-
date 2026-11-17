# 관리자 로그인 수정 사항

- 관리자 아이디 `gin77777` 또는 이메일 `gin77777@naver.com` 입력 가능.
- 비밀번호는 **소스코드에 저장하지 않음**. Supabase Authentication > Users에서 설정한 실제 비밀번호로 로그인해야 함.
- 로그인 후 회원가입/로그인 화면의 `내 계정 · 비밀번호 변경`에서 12자 이상 새 비밀번호 변경 가능.
- 관리자 권한은 Python 서버의 `MOAFILM_ADMIN_EMAIL=gin77777@naver.com` 및 Supabase 이메일 인증 완료를 필요로 함.
- Cloudflare Pages만 배포해서는 작동하지 않음. HTTPS Python 백엔드와 `MOAFILM_BACKEND_URL` 설정 필수.
- GitHub 업로드 시 이 ZIP의 *내용물*을 `moafilm-current-work` 폴더에 넣고, Cloudflare Pages 빌드 출력은 `site`, Functions는 프로젝트 루트 `functions/`.
- 비밀번호 변경은 Supabase Auth `/auth/v1/user` PUT 호출을 사용. 기존 로그인 세션은 최대 1시간이며 만료 후 재로그인.
- 실제 운영 환경에서 인증/권한/영상 렌더링 통합 테스트가 필요함.
