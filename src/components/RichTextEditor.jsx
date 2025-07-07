import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Estilo por defecto

const RichTextEditor = ({ value, onChange }) => {
    const modules = {
        toolbar: [
            [{ 'header': '1'}, {'header': '2'}, { 'font': [] }],
            [{size: []}],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{'list': 'ordered'}, {'list': 'bullet'}, 
             {'indent': '-1'}, {'indent': '+1'}],
            ['link', 'image'],
            ['clean'],
            [{ 'align': [] }]
        ],
    };

    const formats = [
        'header', 'font', 'size',
        'bold', 'italic', 'underline', 'strike', 'blockquote',
        'list', 'bullet', 'indent',
        'link', 'image', 'align'
    ];

    const handleChange = (content, delta, source, editor) => {
        if (editor.getText().trim().length === 0) {
            onChange('');
        } else {
            onChange(content);
        }
    };

    return (
        <ReactQuill 
            theme="snow" 
            value={value} 
            onChange={handleChange}
            modules={modules}
            formats={formats}
        />
    );
};

export default RichTextEditor;
