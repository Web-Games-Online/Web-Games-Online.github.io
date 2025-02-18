<?php
header('Content-Type: application/json');

$uploadDir = 'Saves/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

if ($_FILES['file']) {
    $file = $_FILES['file'];
    $fileName = basename($file['name']);
    $targetPath = $uploadDir . $fileName;
    
    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        echo json_encode([
            'success' => true,
            'filepath' => $targetPath,
            'filename' => $fileName
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'error' => 'Failed to move uploaded file'
        ]);
    }
} else {
    echo json_encode([
        'success' => false,
        'error' => 'No file uploaded'
    ]);
}
?>
