from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from bson import ObjectId
from typing import Dict, Any, Optional
from src.core.database import get_users_collection

# from src.services.user_service import get_user_by_id
from src.core.security import SECRET_KEY, ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/login"
)


def serialize_user(user_doc):
    if not user_doc:
        return None

    user_doc = dict(user_doc)

    user_doc["id"] = str(user_doc.pop("_id"))

    first = user_doc.get("first_name", "")
    last = user_doc.get("last_name", "")

    user_doc["name"] = f"{first} {last}".strip()

    # user_doc["picture"] = user_doc.get("picture", "")

    return user_doc

def get_user_by_id(
    user_id: str
) -> Optional[Dict[str, Any]]:

    users_col = get_users_collection()

    user_doc = users_col.find_one(
        {
            "_id": str(user_id)
        }
    )

    return serialize_user(user_doc)

def get_current_user(
    token: str = Depends(oauth2_scheme)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials"
    )

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")

        if user_id is None:
            raise credentials_exception

    except jwt.PyJWTError:
        raise credentials_exception

    user = get_user_by_id(user_id)

    if user is None:
        raise credentials_exception

    return user
