Add-Type -AssemblyName System.Drawing

$srcPath = "d:\stitch_multi_tenant_saas_pos_system\Sika POS Glossy Fintech Logo.png"
$src = [System.Drawing.Bitmap]::FromFile($srcPath)

function CreateSquareIcon($size, $outputPath, $isMaskable, $bgColor) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    if ($bgColor -ne $null) {
        $bgBrush = New-Object System.Drawing.SolidBrush($bgColor)
        $g.FillRectangle($bgBrush, 0, 0, $size, $size)
        $bgBrush.Dispose()
    } else {
        $g.Clear([System.Drawing.Color]::Transparent)
    }

    # Safe zone: 80% for maskable to prevent clipping by squircle/circle masks
    $scale = if ($isMaskable) { 0.76 } else { 0.90 }

    $targetW = [int]($size * $scale)
    $targetH = [int](($src.Height / $src.Width) * $targetW)

    if ($targetH -gt ($size * $scale)) {
        $targetH = [int]($size * $scale)
        $targetW = [int](($src.Width / $src.Height) * $targetH)
    }

    $x = [int](($size - $targetW) / 2)
    $y = [int](($size - $targetH) / 2)

    $rect = New-Object System.Drawing.Rectangle($x, $y, $targetW, $targetH)
    $g.DrawImage($src, $rect)

    $g.Dispose()
    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Generated: $outputPath ($size x $size)"
}

$emeraldBg = [System.Drawing.Color]::FromArgb(255, 13, 92, 58) # #0D5C3A

# Regular icons (transparent or emerald)
CreateSquareIcon 512 "d:\stitch_multi_tenant_saas_pos_system\client\public\icons\icon-512.png" $false $emeraldBg
CreateSquareIcon 192 "d:\stitch_multi_tenant_saas_pos_system\client\public\icons\icon-192.png" $false $emeraldBg

# Maskable icons MUST have solid background
CreateSquareIcon 512 "d:\stitch_multi_tenant_saas_pos_system\client\public\icons\maskable-512.png" $true $emeraldBg
CreateSquareIcon 192 "d:\stitch_multi_tenant_saas_pos_system\client\public\icons\maskable-192.png" $true $emeraldBg

# Apple touch icon and favicon
CreateSquareIcon 180 "d:\stitch_multi_tenant_saas_pos_system\client\public\apple-touch-icon.png" $false $emeraldBg
CreateSquareIcon 64 "d:\stitch_multi_tenant_saas_pos_system\client\public\favicon.png" $false $null

$src.Dispose()
Write-Host "All icons regenerated with solid emerald brand backing for Android WebAPK!"
