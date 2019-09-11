import MainPage from './components/MainPage.vue';
import Admin from './components/Admin.vue';

export const routes =[
    {path: '/',             redirect: '/asc/'},
    {path: '/asc/',         component: MainPage},
    {path: '/asc/admin',    component: Admin}
];