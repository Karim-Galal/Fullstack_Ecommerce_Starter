export default function sitemap(){const u=process.env.NEXT_PUBLIC_APP_URL||"http://localhost:3000";return[{url:u,lastModified:new Date()},{url:`${u}/products`,lastModified:new Date()}]}
