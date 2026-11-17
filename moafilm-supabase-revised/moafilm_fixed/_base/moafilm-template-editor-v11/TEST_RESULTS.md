# 수행한 검증
- `python -m py_compile studio.py security.py`: 통과
- `python test_auth.py`: 통과 (가입, 로그인, 관리자 권한, 고객 분리 기본 API, 모의결제 검증, 로그아웃)
- `python test_new_features.py`: 통과 (영구 DB 경로, 비밀번호 재설정 요청, 잘못된 토큰 거부, 로그인)

미실시: SMTP 실제 메일 송신, 실제 HTTPS 배포, Docker 컨테이너 실행, 대량 동시 접속, 브라우저 전체 흐름, 고객 파일 보안감사, 서버 재시작 중 렌더 복구.
