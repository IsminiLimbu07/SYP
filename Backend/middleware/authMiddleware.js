import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access token is missing"
            });
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({
                    success: false,
                    message: "Invalid or expired token"
                });
            }

            req.user = user;
            next();


        });

        
    } catch (error) {
        console.error("Auth middleware error:", error);
        res.status(500).json({
            sucess: false,
            message: "Internal server error"
        });
        
    };

};

export const isAdmin = (req, res, next) => {
    if(!req.user.is_admin) {
        return res.status(403).json({
            success: false,
            message: "Admin access required"
    });
    }
    next();
};