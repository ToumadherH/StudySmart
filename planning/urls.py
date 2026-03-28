from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import PlanningViewSet

router = DefaultRouter()
router.register(r'', PlanningViewSet, basename='planning')

urlpatterns = router.urls

