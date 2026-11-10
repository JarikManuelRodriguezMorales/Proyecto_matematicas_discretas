# Entorno Independiente — CustomTkinter

> **Nota importante:** este directorio corresponde a la **Tarea Aparte (§10)** para proyectos futuros de escritorio en Python. **No forma parte del simulador web PayGraph** ni altera ninguno de sus archivos.

## 1. Entorno Detectado y Verificado

- **Sistema Operativo:** Windows 11 (`NT 10.0`)
- **Intérprete base utilizado:** `C:\Users\jarod\miniconda3\python.exe` (Python `3.13.12` con `tkinter` / `Tcl/Tk 8.6` integrado)
- **Ubicación del entorno virtual aislado:** `extras/customtkinter/.venv` (excluido en el archivo `.gitignore` de la raíz)

---

## 2. Comandos de Activación

### En Windows (PowerShell)
Desde la raíz del repositorio:

```powershell
.\extras\customtkinter\.venv\Scripts\Activate.ps1
```

> **Nota sobre la Política de Ejecución en PowerShell (`ExecutionPolicy`):**  
> Si Windows PowerShell bloquea la ejecución de `Activate.ps1` con el error `PSSecurityException` (*"la ejecución de scripts está deshabilitada en este sistema"*), autoriza la ejecución únicamente para la sesión actual de terminal (sin modificar la configuración global ni requerir permisos de administrador) ejecutando:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
> .\extras\customtkinter\.venv\Scripts\Activate.ps1
> ```
> También puedes invocar el intérprete del entorno virtual directamente sin activarlo:
> ```powershell
> .\extras\customtkinter\.venv\Scripts\python.exe .\extras\customtkinter\smoke_test.py
> ```

### En macOS / Linux (Bash / Zsh)
Si recreas el entorno virtual en macOS o Linux (`python3 -m venv extras/customtkinter/.venv`):

```bash
source extras/customtkinter/.venv/bin/activate
python -m pip install -r extras/customtkinter/requirements.txt
```
*(En distribuciones Debian/Ubuntu, si el módulo base `tkinter` no está instalado en el sistema: `sudo apt-get install python3-tk`).*

---

## 3. Verificación Rápida (`smoke_test.py`)

El script [`smoke_test.py`](./smoke_test.py) instancia una ventana mínima de `customtkinter` (`320x160`) y programa su cierre automático a los `800 ms` mediante `ventana.after(800, ventana.destroy)`:

```powershell
.\extras\customtkinter\.venv\Scripts\python.exe .\extras\customtkinter\smoke_test.py
```
