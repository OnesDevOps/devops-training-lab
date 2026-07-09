# --- .NET ASP.NET Core Lab Service ---
# Multi-stage build: dotnet restore/publish, run with runtime image

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app
COPY *.csproj .
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o out

FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine
WORKDIR /app
COPY --from=build /app/out .
EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
ENV DOTNET_GCHeapHardLimit=0x18000000
ENTRYPOINT ["dotnet", "LabService.dll"]
