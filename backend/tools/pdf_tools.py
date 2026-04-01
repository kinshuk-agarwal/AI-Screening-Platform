import fitz  # PyMuPDF
import docx
from typing import BinaryIO

def extract_text_from_resume(file: BinaryIO, filename: str) -> str:
    """Extracts text from an uploaded PDF or DOCX file."""
    try:
        filename_lower = filename.lower()
        text = ""
        
        if filename_lower.endswith('.pdf'):
            # PyMuPDF requires bytes for memory streaming
            pdf_bytes = file.read()
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            for page in doc:
                text += page.get_text()
            doc.close()
            
        elif filename_lower.endswith('.docx') or filename_lower.endswith('.doc'):
            # python-docx reads cleanly from file-like binary objects
            doc = docx.Document(file)
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
            
        else:
            return f"Error: Unsupported file format for {filename}"
            
        return text
    except Exception as e:
        print(f"Error extracting resume text: {str(e)}")
        return ""
