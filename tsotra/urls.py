from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def root(_request):
    return JsonResponse({
        'service': 'tsotra-api',
        'docs': 'https://github.com/nomena-sombiniaina-alfa/tsotra',
        'endpoints': {
            'auth': '/api/auth/{register,login,refresh}/',
            'offers': '/api/offers/',
            'apply': '/api/offers/<id>/apply/',
            'me': '/api/me/',
            'my_offers': '/api/me/offers/',
            'admin': '/admin/',
        },
    })


urlpatterns = [
    path('', root),
    path('admin/', admin.site.urls),
    path('api/', include('gestion.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
