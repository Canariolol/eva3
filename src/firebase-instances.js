const defaultConfig = {
  apiKey: "AIzaSyCzH7D38TffwS24KeLzBA37lOMc7XtaTLw",
  authDomain: "eva3-1b284.firebaseapp.com",
  projectId: "eva3-1b284",
  storageBucket: "eva3-1b284.appspot.com",
  messagingSenderId: "636042825570",
  appId: "1:636042825570:web:4841cfc98c02d30085a63b",
  measurementId: "G-3P009KB1CM"
};

const cathywestConfig = {
  apiKey: "AIzaSyBFnBZsoGPewX50ZHlPswgt_kfi8Dan-eY",
  authDomain: "eva3-cathywest.firebaseapp.com",
  projectId: "eva3-cathywest",
  storageBucket: "eva3-cathywest.appspot.com",
  messagingSenderId: "176410237676",
  appId: "1:176410237676:web:1e2e8ed466d398707da3c9",
  measurementId: "G-2KDGGRDZ5K"
};

const eva3DemoConfig = {
  apiKey: "AIzaSyAr7O4_6v6KyqWJtmrYFfRtdWIcQozW4CA",
  authDomain: "eva3-demo.firebaseapp.com",
  projectId: "eva3-demo",
  storageBucket: "eva3-demo.appspot.com",
  messagingSenderId: "384836031859",
  appId: "1:384836031859:web:1051ed842a1f24c99ce106",
  measurementId: "G-TFL5455KWT"
};

export const instances = {
  // El subdominio 'localhost' usará la configuración por defecto.
  'localhost': defaultConfig, 
  
  'eva3-cathywest': cathywestConfig, 

  'eva3-demo': eva3DemoConfig, 
  
  // Configuración por defecto si no se encuentra un subdominio que coincida
  'default': eva3DemoConfig,
};
