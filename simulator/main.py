import os
import time
from fastapi import FastAPI
import uvicorn
import httpx

app = FastAPI(title="okdriver Simulator")

@app.get("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)\n