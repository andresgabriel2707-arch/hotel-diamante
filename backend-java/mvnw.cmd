@REM Maven Wrapper para Windows — Hotel Diamante
@REM Usa Java para descargar si curl/certutil no están disponibles
@echo off
setlocal

set "MAVEN_PROJECTBASEDIR=%~dp0"
set "WRAPPER_DIR=%MAVEN_PROJECTBASEDIR%.mvn\wrapper"
set "WRAPPER_JAR=%WRAPPER_DIR%\maven-wrapper.jar"
set "WRAPPER_URL=https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar"

if not exist "%WRAPPER_DIR%" mkdir "%WRAPPER_DIR%"

@REM Descargar maven-wrapper.jar si no existe usando Java
if not exist "%WRAPPER_JAR%" (
    echo Descargando Maven Wrapper usando Java...
    java -cp . -e "" 2>nul
    java -Xmx32m -cp "%~dp0" DownloadWrapper "%WRAPPER_URL%" "%WRAPPER_JAR%" 2>nul
    if not exist "%WRAPPER_JAR%" (
        echo Intentando descarga alternativa...
        echo import java.net.*;import java.io.*;class D{public static void main(String[] a)throws Exception{try(InputStream i=new URL(a[0]).openStream();FileOutputStream o=new FileOutputStream(a[1])){byte[] b=new byte[8192];int n;while((n=i.read(b))!=-1)o.write(b,0,n);}} } > "%WRAPPER_DIR%\D.java"
        javac "%WRAPPER_DIR%\D.java"
        java -cp "%WRAPPER_DIR%" D "%WRAPPER_URL%" "%WRAPPER_JAR%"
        del "%WRAPPER_DIR%\D.java" "%WRAPPER_DIR%\D.class" 2>nul
    )
    if not exist "%WRAPPER_JAR%" (
        echo ERROR: No se pudo descargar Maven Wrapper.
        exit /b 1
    )
    echo Maven Wrapper descargado correctamente.
)

@REM Ejecutar Maven via wrapper
java -cp "%WRAPPER_JAR%" org.apache.maven.wrapper.MavenWrapperMain %*

endlocal
