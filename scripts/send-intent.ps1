param(
  [string]$url = "https://iron-metal.net/",
  [string]$device = ""  # optional adb device id
)

# Usage: .\send-intent.ps1 -url "http://iron-metal.net/" -device "emulator-5554"

$adb = "adb"
if ($device -ne "") { $deviceArg = "-s $device" } else { $deviceArg = "" }

Write-Host "Sending VIEW intent to URL: $url"

$cmd = "$adb $deviceArg shell am start -a android.intent.action.VIEW -c android.intent.category.BROWSABLE -d `"$url`""
Write-Host "Running: $cmd"

# Execute
Invoke-Expression $cmd

Write-Host "Done. Watch the device/emulator to see which app handles the URL."