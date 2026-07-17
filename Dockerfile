# 1. Etapa de construcción (usamos el SDK)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copiamos el archivo de proyecto y restauramos las dependencias
COPY *.csproj ./
RUN dotnet restore

# Copiamos el resto del código y compilamos la versión de producción
COPY . ./
RUN dotnet publish -c Release -o /app/out

# 2. Etapa de ejecución (usamos solo el runtime para que sea más liviano)
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/out .

# Le decimos a la aplicación que escuche en el puerto 8080 (el estándar de Render)
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "BandTrackerAPI.dll"]