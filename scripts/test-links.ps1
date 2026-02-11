param(
  [string]$device = "",
  [switch]$uninstallOld
)

# Quick test sequence:
# 1) Optionally uninstall old package (provide package name manually below)
# 2) Send http://iron-metal.net (should open external browser)
# 3) Send https://iron-metal.net (may open the app if App Link verified)
# 4) Send app-scheme ironmetal:// (should open the app)

$packageName = "com.yourcompany.yourapp"  # <- REPLACE with your app package id if you want uninstall
$httpUrl = "http://iron-metal.net/"
$httpsUrl = "https://iron-metal.net/"
$appScheme = "ironmetal://"

if ($uninstallOld) {
  if ($device -ne "") { $deviceArg = "-s $device" } else { $deviceArg = "" }
  Write-Host "Uninstalling package $packageName on device $device"
  & adb $deviceArg uninstall $packageName
}

Write-Host "\n1) Send HTTP (should open external browser)"
.\scripts\send-intent.ps1 -url $httpUrl -device $device
Start-Sleep -Seconds 2

Write-Host "\n2) Send HTTPS (may open app if verified)"
.\scripts\send-intent.ps1 -url $httpsUrl -device $device
Start-Sleep -Seconds 2

Write-Host "\n3) Send App-scheme (should open app)"
.\scripts\send-intent.ps1 -url $appScheme -device $device

Write-Host "\nTest complete. Observe device behavior for each step."