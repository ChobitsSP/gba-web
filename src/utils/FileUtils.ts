



export async function OpenRomFile() {
  const pickerOpts = {
    types: [
      {
        description: 'rom',
        accept: {
          'application/octet-stream': ['.gba', '.gbc', '.gb']
        }
      },
    ],
    excludeAcceptAllOption: true,
    multiple: false
  };

  try {
    const [fileHandle] = await window['showOpenFilePicker'](pickerOpts);
    // get file contents
    const fileData = await fileHandle.getFile();
    console.log(fileData);
  } catch {

  }
}