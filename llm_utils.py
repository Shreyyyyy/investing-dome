import sys
import requests
import json
from openai import OpenAI
from groq import Groq

def get_ollama_models(host: str = "http://localhost:11434") -> list:
    """
    Fetches the list of locally installed Ollama models.
    Returns a list of model names, or empty list if Ollama is not running.
    """
    try:
        response = requests.get(f"{host}/api/tags", timeout=3)
        if response.status_code == 200:
            data = response.json()
            models = [m["name"] for m in data.get("models", [])]
            return models
    except Exception:
        # Ollama might not be running or installed
        pass
    return []

def test_ollama_connection(host: str = "http://localhost:11434") -> bool:
    """
    Checks if Ollama is running at the specified host.
    """
    try:
        response = requests.get(host, timeout=2)
        return response.status_code == 200
    except Exception:
        return False

def call_groq(prompt: str, system_prompt: str, api_key: str, model: str = "llama3-8b-8192", temperature: float = 0.2) -> str:
    """
    Calls the Groq API.
    """
    if not api_key:
        raise ValueError("Groq API Key is missing. Please provide it in the sidebar or set GROQ_API_KEY env variable.")
    
    try:
        client = Groq(api_key=api_key)
        completion = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            temperature=temperature,
            max_tokens=4096,
        )
        return completion.choices[0].message.content
    except Exception as e:
        raise Exception(f"Groq API Error: {str(e)}")

def call_ollama(prompt: str, system_prompt: str, model: str, host: str = "http://localhost:11434", temperature: float = 0.2) -> str:
    """
    Calls a local Ollama instance.
    """
    url = f"{host}/api/chat"
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        "options": {
            "temperature": temperature
        },
        "stream": False
    }
    
    try:
        response = requests.post(url, json=payload, timeout=90)
        response.raise_for_status()
        data = response.json()
        return data.get("message", {}).get("content", "")
    except Exception as e:
        raise Exception(f"Ollama Error (Make sure Ollama is running & model is downloaded): {str(e)}")

def call_openai(prompt: str, system_prompt: str, api_key: str, model: str = "gpt-4o-mini", temperature: float = 0.2) -> str:
    """
    Calls the OpenAI API.
    """
    if not api_key:
        raise ValueError("OpenAI API Key is missing. Please provide it in the sidebar.")
    
    try:
        client = OpenAI(api_key=api_key)
        completion = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            temperature=temperature,
        )
        return completion.choices[0].message.content
    except Exception as e:
        raise Exception(f"OpenAI API Error: {str(e)}")

def call_custom_openai(prompt: str, system_prompt: str, base_url: str, model: str, api_key: str = "sk-dummy", temperature: float = 0.2) -> str:
    """
    Calls a custom OpenAI-compatible endpoint.
    """
    try:
        client = OpenAI(base_url=base_url, api_key=api_key or "sk-dummy")
        completion = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            temperature=temperature,
        )
        return completion.choices[0].message.content
    except Exception as e:
        raise Exception(f"Custom OpenAI API Error: {str(e)}")

def analyze_with_llm(
    prompt: str, 
    system_prompt: str, 
    provider: str, 
    model: str, 
    api_key: str = "", 
    host_or_url: str = "", 
    temperature: float = 0.2
) -> str:
    """
    Unified LLM router.
    """
    provider_lower = provider.lower()
    if provider_lower == "groq":
        return call_groq(prompt, system_prompt, api_key, model, temperature)
    elif provider_lower == "ollama":
        host = host_or_url if host_or_url else "http://localhost:11434"
        return call_ollama(prompt, system_prompt, model, host, temperature)
    elif provider_lower == "openai":
        return call_openai(prompt, system_prompt, api_key, model, temperature)
    elif provider_lower == "custom":
        if not host_or_url:
            raise ValueError("Custom Endpoint URL is required.")
        return call_custom_openai(prompt, system_prompt, host_or_url, model, api_key, temperature)
    else:
        raise ValueError(f"Unknown LLM Provider: {provider}")
