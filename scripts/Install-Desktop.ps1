# Copies the complete public repository into the exact requested Desktop folder.
# Does not overwrite an existing nonempty folder or download credentials/data.
$ErrorActionPreference = 'Stop'
$desktopPath = [Environment]::GetFolderPath('Desktop')
if ([string]::IsNullOrWhiteSpace($desktopPath)) { throw 'Windows Desktop path is unavailable.' }
$projectPath = Join-Path $desktopPath 'HIGPringting WEB'
if ((Test-Path -LiteralPath $projectPath) -and (Get-ChildItem -LiteralPath $projectPath -Force | Select-Object -First 1)) {
    throw "Folder already contains files: $projectPath. Keep your edits; use git pull inside that folder to update an existing clone."
}
if (Get-Command git -ErrorAction SilentlyContinue) {
    git clone --branch main https://github.com/plummz/HIGPrintingServices.git "$projectPath"
    if ($LASTEXITCODE -ne 0) { throw 'Git clone failed. Existing files were not overwritten.' }
} else {
    $downloadPath = Join-Path ([IO.Path]::GetTempPath()) ('higp-' + [guid]::NewGuid())
    New-Item -ItemType Directory -Path $downloadPath | Out-Null
    try {
        $zipPath = Join-Path $downloadPath 'source.zip'
        Invoke-WebRequest -Uri 'https://github.com/plummz/HIGPrintingServices/archive/refs/heads/main.zip' -OutFile $zipPath
        Expand-Archive -LiteralPath $zipPath -DestinationPath $downloadPath
        $sourcePath = Join-Path $downloadPath 'HIGPrintingServices-main'
        New-Item -ItemType Directory -Path $projectPath -Force | Out-Null
        Get-ChildItem -LiteralPath $sourcePath -Force | Copy-Item -Destination $projectPath -Recurse -Force
    } finally { Remove-Item -LiteralPath $downloadPath -Recurse -Force }
}
Write-Output "Project copied to: $projectPath"
Write-Output 'Open README.md for preview and secure-app setup. No production secrets or accounts are included.'
