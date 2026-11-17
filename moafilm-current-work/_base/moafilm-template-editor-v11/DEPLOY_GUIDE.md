# 모아필름 온라인 배포 준비 안내 (실서버 배포 전 검증 필요)

## 서버 요구사항
- 공인 IP가 있는 Linux VPS, Docker Engine + Compose plugin, DNS A/AAAA 레코드, 80/443 포트 개방
- 영상 인코딩용 충분한 CPU/메모리/디스크 용량. 사용량 측정 후 증설
- 도메인만 있거나 Cloudflare Pages 정적 호스팅만 있는 경우 FFmpeg 서버가 추가로 필요

## 배포 명령
1. `.env.example`을 `.env`로 복사하고 `MOAFILM_DOMAIN`, `MOAFILM_PUBLIC_ORIGIN=https://도메인`, SMTP 환경변수 설정
2. `MOAFILM_HTTPS=1`, `MOAFILM_REQUIRE_VERIFIED=1`, `MOAFILM_BOOTSTRAP_ADMIN=0` 확인
3. 관리자 초기화가 필요한 최초 1회만 **비공개 환경에서** `MOAFILM_BOOTSTRAP_ADMIN=1`로 관리자 가입 후 즉시 0으로 변경하고 컨테이너 재생성. 공개 사이트에 1로 두지 말 것
4. `docker compose -f compose.public.yaml up -d --build`
5. HTTPS 인증서 발급/갱신 로그 확인: `docker compose -f compose.public.yaml logs caddy`
6. 계정 두 개로 로그인, 서로의 영상 접근 불가, SMTP 이메일 인증/재설정, 실제 사진 포함 150초 렌더링, 백업 복구를 확인한 후에만 고객 공개

## 공개 전 반드시 보완할 항목
- `/api/checkout/mock`은 결제 없이 영상 제작을 허용하는 **테스트 전용**입니다. 공개 상용 운영 전에 반드시 서버에서 비활성화하고 PG 웹훅 검증으로 대체해야 합니다.
- 이메일 발송 오류, 요청 속도 제한, CSRF, 악성 업로드, 고객 사진 보관/삭제, 백업 암호화, 렌더링 큐/자동 복구, 장애 모니터링을 추가 검증해야 합니다.
- 운영 서버/도메인 계정 접근권한이 이 채팅에 없어 실제 배포를 수행하지 않았습니다.
