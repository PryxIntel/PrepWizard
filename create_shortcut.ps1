$desktopPath = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
$shortcutPath = Join-Path $desktopPath "PrepWizard.lnk"
$wsh = New-Object -ComObject WScript.Shell
$shortcut = $wsh.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "d:\PrepWizard\start.bat"
$shortcut.WorkingDirectory = "d:\PrepWizard"
$shortcut.Description = "PrepWizard CBT Engineering Exam Platform"
$shortcut.IconLocation = "shell32.dll,43"
$shortcut.Save()
Write-Output "Shortcut created at $shortcutPath"
