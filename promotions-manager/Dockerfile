FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt
COPY main.py reset_admin_once.py dashboard.html /app/
RUN useradd --create-home --uid 10001 manager
USER manager
EXPOSE 8000
CMD ["sh","-c","exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
