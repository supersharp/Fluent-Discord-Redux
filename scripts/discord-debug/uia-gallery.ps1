Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
$p = Get-Process WinUIGallery | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
$root = [System.Windows.Automation.AutomationElement]::FromHandle($p.MainWindowHandle)
$all = $root.FindAll([System.Windows.Automation.TreeScope]::Descendants, [System.Windows.Automation.Condition]::TrueCondition)
$i = 0
foreach ($el in $all) {
    $name = $el.Current.Name
    $type = $el.Current.ControlType.ProgrammaticName
    if ($name -and ($type -match 'Button|ListItem|TabItem|Hyperlink|MenuItem')) {
        Write-Output ("{0}|{1}|{2}" -f $type, $name, $el.Current.AutomationId)
        $i++
        if ($i -ge 60) { break }
    }
}
