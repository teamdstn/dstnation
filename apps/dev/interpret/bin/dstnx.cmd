:: Created by npm, please don't edit manually.
@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  "..\lib\index" %*
) ELSE (
  node  "..\lib\index" %*
)