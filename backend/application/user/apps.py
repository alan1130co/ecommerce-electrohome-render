from django.apps import AppConfig


class UserConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'application.user'

    def ready(self):
        import application.user.signals  # noqa
