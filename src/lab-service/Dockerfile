# --- .NET ASP.NET Core Lab Service ---
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine
WORKDIR /app
COPY out .
EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
ENV DOTNET_GCHeapHardLimit=0x18000000
ENTRYPOINT ["dotnet", "LabService.dll"]
