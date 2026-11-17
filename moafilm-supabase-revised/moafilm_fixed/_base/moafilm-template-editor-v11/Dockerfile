FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg fonts-dejavu-core && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY studio.py security.py marker_detector.py index.html ./
RUN pip install --no-cache-dir Pillow opencv-python-headless numpy
RUN useradd -m -u 10001 appuser && mkdir -p /data && chown appuser:appuser /data
USER appuser
ENV MOAFILM_HOST=0.0.0.0 PORT=8890 MOAFILM_DATA_DIR=/data
EXPOSE 8890
VOLUME ["/data"]
CMD ["python","studio.py"]
