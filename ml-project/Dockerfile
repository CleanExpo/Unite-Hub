# Use a Linux-based Python 3.9 slim image for ML tasks
FROM python:3.9-slim-bullseye

# Set working directory
WORKDIR /app

# Copy and install dependencies from requirements.txt
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY app.py .

# Set the command to run the application
CMD ["python", "app.py"]
