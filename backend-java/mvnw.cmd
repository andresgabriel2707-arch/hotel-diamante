@REM Maven Wrapper para Windows — Hotel Diamante
@echo off
setlocal

set "MAVEN_PROJECTBASEDIR=%~dp0"
set "WRAPPER_DIR=%MAVEN_PROJECTBASEDIR%.mvn\wrapper"
set "WRAPPER_JAR=%WRAPPER_DIR%\maven-wrapper.jar"
set "WRAPPER_URL=https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar"

if not exist "%WRAPPER_DIR%" mkdir "%WRAPPER_DIR%"

@REM Descargar maven-wrapper.jar si no existe (usa curl integrado en Windows 10+)
if not exist "%WRAPPER_JAR%" (
    echo Descargando Maven Wrapper...
    curl -f -s -o "%WRAPPER_JAR%" "%WRAPPER_URL%"
    if not exist "%WRAPPER_JAR%" (
        echo ERROR: No se pudo descargar Maven Wrapper.
        echo Descargue manualmente: %WRAPPER_URL%
        echo y coloquelo en: %WRAPPER_DIR%
        exit /b 1
    )
    echo Maven Wrapper descargado.
)

@REM Ejecutar Maven via wrapper
java -cp "%WRAPPER_JAR%" org.apache.maven.wrapper.MavenWrapperMain %*

endlocal
