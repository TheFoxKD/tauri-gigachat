from langchain_gigachat.chat_models import GigaChat


def create_gigachat_llm(*, credentials: str, streaming: bool = True) -> GigaChat:
    return GigaChat(
        credentials=credentials,
        verify_ssl_certs=False,
        streaming=streaming,
    )
