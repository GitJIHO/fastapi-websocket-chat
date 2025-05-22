import subprocess
import time
from pyngrok import ngrok
import os

# ngrok 인증 토큰 설정
def setup_ngrok(auth_token):
    ngrok.set_auth_token(auth_token)
    
    # ngrok 터널 생성
    http_tunnel = ngrok.connect(3000)
    public_url = http_tunnel.public_url
    print(f"\n* ngrok 터널이 생성되었습니다: {public_url}")
    print("* 이 URL을 통해 외부에서 채팅 애플리케이션에 접속할 수 있습니다.\n")
    
    return public_url

if __name__ == "__main__":
    # 인증 토큰 입력 받기
    auth_token = input("ngrok 인증 토큰을 입력하세요: ")
    
    # ngrok 설정
    public_url = setup_ngrok(auth_token)
    
    try:
        # 애플리케이션이 계속 실행되도록 대기
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        # 종료 시 프로세스 정리
        ngrok.kill()
        print("\nngrok 터널이 종료되었습니다.")
        