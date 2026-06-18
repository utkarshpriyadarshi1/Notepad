# setup-cert.ps1
# Generate a Windows self-signed code signing certificate for app packaging

$certName = "NotepadDevelopmentCert"
$certPath = Join-Path $PSScriptRoot "development-cert.pfx"
$password = ConvertTo-SecureString "NotepadTempPassword123" -AsPlainText -Force

Write-Host "Creating self-signed code-signing certificate: $certName..." -ForegroundColor Cyan

try {
    # Generate the certificate
    $cert = New-SelfSignedCertificate -Type CodeSigningCert -Subject "CN=$certName" -KeyUsage DigitalSignature -FriendlyName "Notepad Dev Certificate" -NotAfter (Get-Date).AddYears(5)
    
    # Export the certificate as PFX
    Write-Host "Exporting certificate to: $certPath..." -ForegroundColor Cyan
    Export-PfxCertificate -Cert $cert -FilePath $certPath -Password $password
    
    # Install the certificate locally in Trusted Root Certification Authorities to trust it on the local dev machine
    Write-Host "Installing certificate to local root store (requires admin privileges)..." -ForegroundColor Cyan
    $rootStore = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root", "LocalMachine")
    $rootStore.Open("ReadWrite")
    $rootStore.Add($cert)
    $rootStore.Close()
    
    Write-Host "✅ Self-signed code signing certificate created and registered successfully!" -ForegroundColor Green
} catch {
    Write-Error "❌ Failed to generate or register certificate: $_"
}
