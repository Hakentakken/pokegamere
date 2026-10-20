param([string[]]$Patterns = @('onClick','navigate','useNavigate'))

$files = Get-ChildItem c:\Users\ASUS\Desktop\pokegamere\src -Recurse -Include *.tsx,*.ts | Select-Object -ExpandProperty FullName
$linesAll = New-Object System.Collections.Generic.List[string]

foreach ($f in $files) {
  $content = Get-Content $f -Raw
  $content = $content -replace "`r`n?", "`n"
  $lines = $content -split "`n"
  for ($i = 0; $i -lt $lines.Count; $i++) {
    $l = $lines[$i].Trim()
    foreach ($p in $Patterns) {
      if ($l -match $p) {
        $rel = $f.Substring($f.LastIndexOf('\') + 1)
        $linesAll.Add("$rel`:$( $i + 1 ) : $l")
      }
    }
  }
}

if ($linesAll.Count -gt 0) {
  $linesAll | Sort-Object | Out-File c:\Users\ASUS\Desktop\pokegamere\_navcheck.txt -Encoding UTF8
} else {
  'no onClick/navigate/useNavigate usages' | Out-File c:\Users\ASUS\Desktop\pokegamere\_navcheck.txt -Encoding UTF8
}

Get-Content c:\Users\ASUS\Desktop\pokegamere\_navcheck.txt
